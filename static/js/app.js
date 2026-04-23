const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const registerMessage = document.getElementById("registerMessage");
    const email    = registerForm.email.value.trim();
    const username = registerForm.username.value.trim();
    const password = registerForm.password.value;

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      registerMessage.textContent = "Please enter a valid email address.";
      registerMessage.className = "message error";
      return;
    }
    if (username.length < 3) {
      registerMessage.textContent = "Username must be at least 3 characters.";
      registerMessage.className = "message error";
      return;
    }
    if (password.length < 8) {
      registerMessage.textContent = "Password must be at least 8 characters.";
      registerMessage.className = "message error";
      return;
    }

    const formData = {
      username: username,
      email: email,
      password: password,
    };

    const response = await fetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      registerMessage.textContent = data.message;
      registerMessage.className = "message success";
      setTimeout(() => window.location.href = "/login", 1500);
    } else {
      registerMessage.textContent = data.detail;
      registerMessage.className = "message error";
    }
  });
}


const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const loginMessage = document.getElementById("loginMessage");
    const username = loginForm.username.value.trim();
    const password = loginForm.password.value;

    if (!username) {
      loginMessage.textContent = "Username is required.";
      loginMessage.className = "message error";
      return;
    }
    if (!password) {
      loginMessage.textContent = "Password is required.";
      loginMessage.className = "message error";
      return;
    }

    const formData = {
      username: username,
      password: password,
    };

    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("access_token", data.access_token);
      window.location.href = "/dashboard";
    } else {
      loginMessage.textContent = data.detail;
      loginMessage.className = "message error";
    }
  });
}


const calculationForm = document.getElementById("calculationForm");

if (calculationForm) {
  calculationForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const calculationResult = document.getElementById("calculationResult");
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    const inputs = calculationForm.numbers.value
      .split(",")
      .map((number) => Number(number.trim()));

    const response = await fetch("/calculations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: calculationForm.type.value,
        inputs: inputs,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      calculationResult.textContent = `Result: ${data.result}`;
      calculationResult.className = "message success";
    } else {
      calculationResult.textContent = data.detail;
      calculationResult.className = "message error";
    }
  });
}
