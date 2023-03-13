package com.company.payroll.service;

import com.company.payroll.dao.ManagerRepository;
import com.company.payroll.dao.WalletRepository;
import com.company.payroll.model.Wallet;
import com.company.payroll.model.Manager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class DatabaseLoader implements CommandLineRunner {

	private final WalletRepository wallet;
	private final ManagerRepository managers;

	@Autowired
	public DatabaseLoader(WalletRepository walletRepository,
						  ManagerRepository managerRepository) {

		this.wallet = walletRepository;
		this.managers = managerRepository;
	}

	@Override
	public void run(String... strings) {

		Manager alice = this.managers.save(new Manager("alice", "password1",
							"ROLE_MANAGER"));
		Manager bob = this.managers.save(new Manager("bob", "password2",
							"ROLE_MANAGER"));

		SecurityContextHolder.getContext().setAuthentication(
			new UsernamePasswordAuthenticationToken("alice", "doesn't matter",
				AuthorityUtils.createAuthorityList("ROLE_MANAGER")));

		this.wallet.save(new Wallet("description", alice, 0.0));
		this.wallet.save(new Wallet("description", alice, 0.0));
		this.wallet.save(new Wallet("description", alice, 0.0));

		SecurityContextHolder.getContext().setAuthentication(
			new UsernamePasswordAuthenticationToken("bob", "doesn't matter",
				AuthorityUtils.createAuthorityList("ROLE_MANAGER")));

		this.wallet.save(new Wallet("description", bob, 0.0));
		this.wallet.save(new Wallet( "description", bob, 0.0));
		this.wallet.save(new Wallet("description", bob, 0.0));

		SecurityContextHolder.clearContext();
	}
}
