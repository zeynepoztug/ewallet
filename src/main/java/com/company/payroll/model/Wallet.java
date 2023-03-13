package com.company.payroll.model;

import java.util.Objects;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.Version;

import com.fasterxml.jackson.annotation.JsonIgnore;
import javax.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Wallet {

	private @Id @GeneratedValue Long id;
	private String description;

	@Min(value = 0L, message = "The value must be positive")
	private Double balance;

	private @Version @JsonIgnore Long version;

	private @ManyToOne
	Manager manager;

	public Wallet(String description, Manager manager, Double balance) {
		this.description = description;
		this.manager = manager;
		this.balance = balance;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (o == null || getClass() != o.getClass()) return false;
		Wallet wallet = (Wallet) o;
		return Objects.equals(id, wallet.id) &&
			Objects.equals(description, wallet.description) &&
			Objects.equals(version, wallet.version) &&
			Objects.equals(manager, wallet.manager) &&
				Objects.equals(balance, wallet.balance);
	}

	@Override
	public int hashCode() {

		return Objects.hash(id, description, version, manager, balance);
	}

	@Override
	public String toString() {
		return "Wallet{" +
			"id=" + id +
			", description='" + description + '\'' +
			", version=" + version +
			", manager=" + manager +
				", balance=" + balance +
			'}';
	}
}
