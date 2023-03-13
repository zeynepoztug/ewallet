Single repository holding a sample wallet application with spring security authentication, spring boot and react library.
Scenario: 
- Users and roles are created via DatabaseLoader.java
- Every user has a role and every user can have more than one wallet
- Every user can edit his wallet, not any others.
- Only ADMIN users can see the wallets, only those who own the wallets can edit the wallet.

### Running service locally

1. Navigate to com.company.payroll package and run
```
    mvn spring-boot:run
```
2. Navigate to src/main/js package and run
```
    npm run-script watch
```
3. Navigate to `localhost:8080` you will be redirected to login form which is supplied by Spring Security.
4. Login as `alice/password1` as stated in DatabaseLoader.java
5. Enjoy!

Visit https://docs.spring.io/spring-security/reference/index.html for updates.
