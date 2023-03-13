'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const when = require('when');
const client = require('./client');

const follow = require('./follow'); // function to hop multiple links by "rel"

const stompClient = require('./websocket-listener');

const root = '/api';

class App extends React.Component {

	constructor(props) {
		super(props);
		this.state = {wallets: [], attributes: [], page: 1, pageSize: 2, links: {}
		   , loggedInManager: this.props.loggedInManager};
		this.updatePageSize = this.updatePageSize.bind(this);
		this.onCreate = this.onCreate.bind(this);
		this.onUpdate = this.onUpdate.bind(this);
		this.onDelete = this.onDelete.bind(this);
		this.onNavigate = this.onNavigate.bind(this);
		this.refreshCurrentPage = this.refreshCurrentPage.bind(this);
		this.refreshAndGoToLastPage = this.refreshAndGoToLastPage.bind(this);
	}

	loadFromServer(pageSize) {
		follow(client, root, [
				{rel: 'wallets', params: {size: pageSize}}]
		).then(walletCollection => {
			return client({
				method: 'GET',
				path: walletCollection.entity._links.profile.href,
				headers: {'Accept': 'application/schema+json'}
			}).then(schema => {
				// tag::json-schema-filter[]
				/**
				 * Filter unneeded JSON Schema properties, like uri references and
				 * subtypes ($ref).
				 */
				Object.keys(schema.entity.properties).forEach(function (property) {
					if (schema.entity.properties[property].hasOwnProperty('format') &&
						schema.entity.properties[property].format === 'uri') {
						delete schema.entity.properties[property];
					}
					else if (schema.entity.properties[property].hasOwnProperty('$ref')) {
						delete schema.entity.properties[property];
					}
				});

				this.schema = schema.entity;
				this.links = walletCollection.entity._links;
				return walletCollection;
				// end::json-schema-filter[]
			});
		}).then(walletCollection => {
			this.page = walletCollection.entity.page;
			return walletCollection.entity._embedded.wallets.map(wallet =>
					client({
						method: 'GET',
						path: wallet._links.self.href
					})
			);
		}).then(walletPromises => {
			return when.all(walletPromises);
		}).done(wallets => {
			this.setState({
				page: this.page,
				wallets: wallets,
				attributes: Object.keys(this.schema.properties),
				pageSize: pageSize,
				links: this.links
			});
		});
	}

	// tag::on-create[]
	onCreate(newWallet) {
		follow(client, root, ['wallets']).done(response => {
			client({
				method: 'POST',
				path: response.entity._links.self.href,
				entity: newWallet,
				headers: {'Content-Type': 'application/json'}
			})
		})
	}
	// end::on-create[]

	// tag::on-update[]
	onUpdate(wallet, updatedWallet) {
		if(wallet.entity.manager.name === this.state.loggedInManager) {
			updatedWallet["manager"] = wallet.entity.manager;
			client({
				method: 'PUT',
				path: wallet.entity._links.self.href,
				entity: updatedWallet,
				headers: {
					'Content-Type': 'application/json',
					'If-Match': wallet.headers.Etag
				}
			}).done(response => {
				/* Let the websocket handler update the state */
			}, response => {
				if (response.status.code === 403) {
					alert('ACCESS DENIED: You are not authorized to update ' +
						wallet.entity._links.self.href);
				}
				if (response.status.code === 412) {
					alert('DENIED: Unable to update ' + wallet.entity._links.self.href +
						'. Your copy is stale.');
				}
			});
		} else {
			alert("You are not authorized to update");
		}
	}
	// end::on-update[]

	// tag::on-delete[]
	onDelete(wallet) {
		client({method: 'DELETE', path: wallet.entity._links.self.href}
		).done(response => {/* let the websocket handle updating the UI */},
		response => {
			if (response.status.code === 403) {
				alert('ACCESS DENIED: You are not authorized to delete ' +
					wallet.entity._links.self.href);
			}
		});
	}
	// end::on-delete[]

	onNavigate(navUri) {
		client({
			method: 'GET',
			path: navUri
		}).then(walletCollection => {
			this.links = walletCollection.entity._links;
			this.page = walletCollection.entity.page;

			return walletCollection.entity._embedded.wallets.map(wallet =>
					client({
						method: 'GET',
						path: wallet._links.self.href
					})
			);
		}).then(walletPromises => {
			return when.all(walletPromises);
		}).done(wallets => {
			this.setState({
				page: this.page,
				wallets: wallets,
				attributes: Object.keys(this.schema.properties),
				pageSize: this.state.pageSize,
				links: this.links
			});
		});
	}

	updatePageSize(pageSize) {
		if (pageSize !== this.state.pageSize) {
			this.loadFromServer(pageSize);
		}
	}

	// tag::websocket-handlers[]
	refreshAndGoToLastPage(message) {
		follow(client, root, [{
			rel: 'wallets',
			params: {size: this.state.pageSize}
		}]).done(response => {
			if (response.entity._links.last !== undefined) {
				this.onNavigate(response.entity._links.last.href);
			} else {
				this.onNavigate(response.entity._links.self.href);
			}
		})
	}

	refreshCurrentPage(message) {
		follow(client, root, [{
			rel: 'wallets',
			params: {
				size: this.state.pageSize,
				page: this.state.page.number
			}
		}]).then(walletCollection => {
			this.links = walletCollection.entity._links;
			this.page = walletCollection.entity.page;

			return walletCollection.entity._embedded.wallets.map(wallet => {
				return client({
					method: 'GET',
					path: wallet._links.self.href
				})
			});
		}).then(walletPromises => {
			return when.all(walletPromises);
		}).then(wallets => {
			this.setState({
				page: this.page,
				wallets: wallets,
				attributes: Object.keys(this.schema.properties),
				pageSize: this.state.pageSize,
				links: this.links
			});
		});
	}
	// end::websocket-handlers[]

	// tag::register-handlers[]
	componentDidMount() {
		this.loadFromServer(this.state.pageSize);
		stompClient.register([
			{route: '/topic/newWallet', callback: this.refreshAndGoToLastPage},
			{route: '/topic/updateWallet', callback: this.refreshCurrentPage},
			{route: '/topic/deleteWallet', callback: this.refreshCurrentPage}
		]);
	}
	// end::register-handlers[]

	render() {
		return (
			<div>
				<CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
				<WalletList page={this.state.page}
							  wallets={this.state.wallets}
							  links={this.state.links}
							  pageSize={this.state.pageSize}
							  attributes={this.state.attributes}
							  onNavigate={this.onNavigate}
							  onUpdate={this.onUpdate}
							  onDelete={this.onDelete}
							  updatePageSize={this.updatePageSize}
							  loggedInManager={this.state.loggedInManager}/>
			</div>
		)
	}
}

class CreateDialog extends React.Component {

	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(e) {
		e.preventDefault();
		const newWallet = {};
		this.props.attributes.forEach(attribute => {
			newWallet[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
		});
		this.props.onCreate(newWallet);
		this.props.attributes.forEach(attribute => {
			ReactDOM.findDOMNode(this.refs[attribute]).value = ''; // clear out the dialog's inputs
		});
		window.location = "#";
	}

	render() {
		const inputs = this.props.attributes.map(attribute =>
			<p key={attribute}>
				<input type="text" placeholder={attribute} ref={attribute} className="field"/>
			</p>
		);
		return (
			<div>
				<a href="#createWallet">Create</a>

				<div id="createWallet" className="modalDialog">
					<div>
						<a href="#" title="Close" className="close">X</a>

						<h2>Create new wallet</h2>

						<form>
							{inputs}
							<button onClick={this.handleSubmit}>Create</button>
						</form>
					</div>
				</div>
			</div>
		)
	}
}

class UpdateDialog extends React.Component {

	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(e) {
		e.preventDefault();
		const updatedWallet = {};
		this.props.attributes.forEach(attribute => {
			updatedWallet[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
		});
		this.props.onUpdate(this.props.wallet, updatedWallet);
		window.location = "#";
	}

	render() {
		const inputs = this.props.attributes.map(attribute =>
			<p key={this.props.wallet.entity[attribute]}>
				<input type="text" placeholder={attribute}
					   defaultValue={this.props.wallet.entity[attribute]}
					   ref={attribute} className="field"/>
			</p>
		);

		const dialogId = "updateWallet-" + this.props.wallet.entity._links.self.href;

		const isManagerCorrect = this.props.wallet.entity.manager.name == this.props.loggedInManager;

		if (isManagerCorrect === false) {
			return (
					<div>
						<a>Not Your Wallet</a>
					</div>
				)
		} else {
			return (
				<div>
					<a href={"#" + dialogId}>Update</a>

					<div id={dialogId} className="modalDialog">
						<div>
							<a href="#" title="Close" className="close">X</a>

							<h2>Update a wallet</h2>

							<form>
								{inputs}
								<button onClick={this.handleSubmit}>Update</button>
							</form>
						</div>
					</div>
				</div>
			)
		}
	}

}

class WalletList extends React.Component {

	constructor(props) {
		super(props);
		this.handleNavFirst = this.handleNavFirst.bind(this);
		this.handleNavPrev = this.handleNavPrev.bind(this);
		this.handleNavNext = this.handleNavNext.bind(this);
		this.handleNavLast = this.handleNavLast.bind(this);
		this.handleInput = this.handleInput.bind(this);
	}

	handleInput(e) {
		e.preventDefault();
		const pageSize = ReactDOM.findDOMNode(this.refs.pageSize).value;
		if (/^[0-9]+$/.test(pageSize)) {
			this.props.updatePageSize(pageSize);
		} else {
			ReactDOM.findDOMNode(this.refs.pageSize).value = pageSize.substring(0, pageSize.length - 1);
		}
	}

	handleNavFirst(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.first.href);
	}

	handleNavPrev(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.prev.href);
	}

	handleNavNext(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.next.href);
	}

	handleNavLast(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.last.href);
	}

	render() {
		const pageInfo = this.props.page.hasOwnProperty("number") ?
			<h3>Wallets - Page {this.props.page.number + 1} of {this.props.page.totalPages}</h3> : null;

		const wallets = this.props.wallets.map(wallet =>
			<Wallet key={wallet.entity._links.self.href}
					  wallet={wallet}
					  attributes={this.props.attributes}
					  onUpdate={this.props.onUpdate}
					  onDelete={this.props.onDelete}
					  loggedInManager={this.props.loggedInManager}/>
		);

		const navLinks = [];
		if ("first" in this.props.links) {
			navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
		}
		if ("prev" in this.props.links) {
			navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>);
		}
		if ("next" in this.props.links) {
			navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>);
		}
		if ("last" in this.props.links) {
			navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
		}

		return (
			<div>
				{pageInfo}
				<input ref="pageSize" defaultValue={this.props.pageSize} onInput={this.handleInput}/>
				<table>
					<tbody>
						<tr>
							<th>Description</th>
							<th>Balance</th>
							<th>Manager</th>
							<th></th>
							<th></th>
						</tr>
						{wallets}
					</tbody>
				</table>
				<div>
					{navLinks}
				</div>
			</div>
		)
	}
}

// tag::wallet[]
class Wallet extends React.Component {

	constructor(props) {
		super(props);
		this.handleDelete = this.handleDelete.bind(this);
	}

	handleDelete() {
		this.props.onDelete(this.props.wallet);
	}

	render() {
		return (
			<tr>
				<td>{this.props.wallet.entity.description}</td>
				<td>{this.props.wallet.entity.balance}</td>
				<td>{this.props.wallet.entity.manager.name}</td>
				<td>
					<UpdateDialog wallet={this.props.wallet}
								  attributes={this.props.attributes}
								  onUpdate={this.props.onUpdate}
								  loggedInManager={this.props.loggedInManager}/>
				</td>
				<td>
					<button onClick={this.handleDelete}>Delete</button>
				</td>
			</tr>
		)
	}
}
// end::wallet[]

ReactDOM.render(
	<App loggedInManager={document.getElementById('managername').innerHTML } />,
	document.getElementById('react')
)

