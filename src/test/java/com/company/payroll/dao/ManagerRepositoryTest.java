package com.company.payroll.dao;

import com.company.payroll.model.Manager;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertEquals;

import static com.company.payroll.utils.Constants.MANAGER_NAME;

@RunWith(SpringRunner.class)
@SpringBootTest
public class ManagerRepositoryTest {

    @Autowired
    private ManagerRepository managerRepository;

    @Test
    public void shouldSaveManager() {
        final Manager manager = new Manager();
        manager.setId(1L);

        final Manager saved = managerRepository.save(manager);

        assertNotNull(saved);
    }

    @Test
    public void findById_shouldReturnTheSameManager() {
        final Manager manager = new Manager();
        manager.setId(1L);
        manager.setName(MANAGER_NAME);

        final Manager saved = managerRepository.save(manager);

        final Manager found = managerRepository.findByName(MANAGER_NAME);

        assertEquals(saved.getName(), found.getName());
    }
}
