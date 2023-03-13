package com.company.payroll.model;

import java.util.Arrays;
import java.util.Objects;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;

import lombok.Data;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
public class Manager {

	public static final PasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder();

	private @Id @GeneratedValue Long id;

	private String name;

	private @JsonIgnore String password;

	private String[] roles;

	public void setPassword(String password) { // <3>
		this.password = PASSWORD_ENCODER.encode(password);
	}

	public Manager() {}

	public Manager(String name, String password, String... roles) {

		this.name = name;
		this.setPassword(password);
		this.roles = roles;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (o == null || getClass() != o.getClass()) return false;
		Manager manager = (Manager) o;
		return Objects.equals(id, manager.id) &&
			Objects.equals(name, manager.name) &&
			Objects.equals(password, manager.password) &&
			Arrays.equals(roles, manager.roles);
	}

	@Override
	public int hashCode() {

		int result = Objects.hash(id, name, password);
		result = 31 * result + Arrays.hashCode(roles);
		return result;
	}

	@Override
	public String toString() {
		return "Manager{" +
			"id=" + id +
			", name='" + name + '\'' +
			", roles=" + Arrays.toString(roles) +
			'}';
	}
}
