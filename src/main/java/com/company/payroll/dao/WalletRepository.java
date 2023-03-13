package com.company.payroll.dao;

import com.company.payroll.model.Wallet;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.security.access.prepost.PreAuthorize;

@PreAuthorize("hasRole('ROLE_MANAGER')")
public interface WalletRepository extends PagingAndSortingRepository<Wallet, Long> {

	@Override
	@PreAuthorize("#wallet?.manager == null or #wallet?.manager?.name == authentication?.name")
	Wallet save(@Param("wallet") Wallet wallet);

	@Override
	@PreAuthorize("@walletRepository.findById(#id)?.manager?.name == authentication?.name")
	void deleteById(@Param("id") Long id);

	@Override
	@PreAuthorize("#wallet?.manager?.name == authentication?.name")
	void delete(@Param("wallet") Wallet wallet);

}
