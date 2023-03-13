package com.company.payroll.config;

import com.company.payroll.model.Wallet;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.core.annotation.HandleAfterCreate;
import org.springframework.data.rest.core.annotation.HandleAfterDelete;
import org.springframework.data.rest.core.annotation.HandleAfterSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;
import org.springframework.hateoas.server.EntityLinks;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RepositoryEventHandler(Wallet.class)
public class EventHandler {

	private final SimpMessagingTemplate websocket;

	private final EntityLinks entityLinks;

	@Autowired
	public EventHandler(SimpMessagingTemplate websocket, EntityLinks entityLinks) {
		this.websocket = websocket;
		this.entityLinks = entityLinks;
	}

	@HandleAfterCreate
	public void newWallet(Wallet wallet) {
		this.websocket.convertAndSend(
				WebSocketConfiguration.MESSAGE_PREFIX + "/newWallet", getPath(wallet));
	}

	@HandleAfterDelete
	public void deleteWallet(Wallet wallet) {
		this.websocket.convertAndSend(
				WebSocketConfiguration.MESSAGE_PREFIX + "/deleteWallet", getPath(wallet));
	}

	@HandleAfterSave
	public void updateWallet(Wallet wallet) {
		this.websocket.convertAndSend(
				WebSocketConfiguration.MESSAGE_PREFIX + "/updateWallet", getPath(wallet));
	}


	private String getPath(Wallet wallet) {
		return this.entityLinks.linkForItemResource(wallet.getClass(),
				wallet.getId()).toUri().getPath();
	}

}
