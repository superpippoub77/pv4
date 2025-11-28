function createLogin() {
    return new Promise(resolve => {
         try {
        const login = document.getElementById("login");
        login.innerHTML = `
            <!-- Login Modal - VolleyProW4 Edition -->
            <div class="volley-bg"></div>
            <div class="volley-ball"></div>

            <div class="login-content">
                <h2 class="login-title" data-i18n="local_login_title">
                    Benvenuto in <span class="highlight">VolleyPro<span class="w4">W4</span></span>
                </h2>
                <h3 class="login-subtitle" data-i18n="local_login_subtitle">
                    Editor Professionale per Allenatori di Pallavolo
                </h3>

                <form id="loginForm">
                    <div class="login-field">
                        <label for="username">Username</label>
                        <input type="text" id="username" name="username" required value="admin">
                    </div>
                    <div class="login-field">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" required value="1234">
                    </div>
                    <div class="login-error" id="loginError">Username o password errati</div>
                    <button type="submit" class="login-button">Accedi</button>
                </form>
            </div>
        `;
        resolve();
        } catch (err) {
            console.error("Errore nella creazione della login:", err);
            reject(err);
        }
    });
}
