package com.company.payroll.dao;

import com.company.payroll.model.Wallet;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.test.context.junit4.SpringRunner;

import static org.junit.jupiter.api.Assertions.assertThrows;

@RunWith(SpringRunner.class)
@SpringBootTest
public class WalletRepoTest {

    @Autowired
    private WalletRepository walletRepository;

    @Test
    public void saveWallet_withoutAuthentication_ShouldThrowException() {
        final Wallet wallet = new Wallet();
        wallet.setId(1L);

        assertThrows(AuthenticationCredentialsNotFoundException.class, () -> walletRepository.save(wallet));
    }

    @Test
    public void deleteWallet_withoutAuthentication_ShouldThrowException() {
        final Wallet wallet = new Wallet();
        wallet.setId(1L);

        assertThrows(AuthenticationCredentialsNotFoundException.class, () -> walletRepository.delete(wallet));
    }

    @Test
    public void deleteByIdWallet_withoutAuthentication_ShouldThrowException() {
        final Wallet wallet = new Wallet();
        wallet.setId(1L);

        assertThrows(AuthenticationCredentialsNotFoundException.class, () -> walletRepository.deleteById(wallet.getId()));
    }

}