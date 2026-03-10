const form = document.getElementById("contact-form");

const nameInput = document.querySelector('input[name="Name"]');
const companyInput = document.querySelector('input[name="Company"]');
const emailInput = document.querySelector('input[name="E_mail"]');
const phoneInput = document.querySelector('input[name="Phone"]');
const messageInput = document.querySelector('textarea[name="Message"]');

const serviceSelect = document.getElementById("service-select");
const otherServiceContainer = document.getElementById("other-service-container");
const otherServiceInput = document.getElementById("other-service-input");

const honeypot = document.getElementById("website-field");


// =====================
// REGEX
// =====================

const nameRegex = /^[A-Za-z\s]{2,50}$/;
const phoneRegex = /^\d{10}$/;
const emailRegex = /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/;

// =====================
// TOAST SYSTEM
// =====================

function showToast(message, type = "success", duration = 3000) {

  const container = document.getElementById("toast-container")

  const toast = document.createElement("div")

  toast.className = `toast toast-${type}`

  toast.innerText = message

  container.appendChild(toast)

  setTimeout(() => {
    toast.remove()
  }, duration)

}


// =====================
// ERROR UI
// =====================

function createError(input) {
  const div = document.createElement("div")
  div.className = "field-error"
  div.style.cssText = "color:#f44336;font-size:13px;margin-top:5px;display:none"
  input.parentNode.appendChild(div)
  return div
}

function showError(el, msg) {
  el.innerText = msg
  el.style.display = "block"
}

function hideError(el) {
  el.style.display = "none"
}


// create error fields

const nameError = createError(nameInput)
const phoneError = createError(phoneInput)
const emailError = createError(emailInput)
const messageError = createError(messageInput)
const serviceError = createError(serviceSelect)


// =====================
// VALIDATION
// =====================

function validateName() {

  if (!nameRegex.test(nameInput.value.trim())) {
    showError(nameError, "Enter valid name")
    return false
  }

  hideError(nameError)
  return true
}

function validatePhone() {

  if (!phoneRegex.test(phoneInput.value)) {
    showError(phoneError, "Enter 10 digit phone number")
    return false
  }

  hideError(phoneError)
  return true
}

function validateEmail() {

  if (!emailRegex.test(emailInput.value.trim())) {
    showError(emailError, "Use valid gmail.com email")
    return false
  }

  hideError(emailError)
  return true
}

function validateMessage() {

  if (messageInput.value.trim().length < 10) {
    showError(messageError, "Message must be at least 10 characters")
    return false
  }

  hideError(messageError)
  return true
}

function validateService() {

  if (!serviceSelect.value) {
    showError(serviceError, "Select service")
    return false
  }

  hideError(serviceError)
  return true
}


// =====================
// PHONE CONTROL
// =====================

phoneInput.addEventListener("input", () => {

  phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10)

})


// =====================
// SERVICE OTHER
// =====================

serviceSelect.addEventListener("change", () => {

  if (serviceSelect.value === "Other") {

    otherServiceContainer.style.display = "block"

  } else {

    otherServiceContainer.style.display = "none"
    otherServiceInput.value = ""

  }

})


// =====================
// REAL TIME VALIDATION
// =====================

nameInput.addEventListener("blur", validateName)
phoneInput.addEventListener("blur", validatePhone)
emailInput.addEventListener("blur", validateEmail)
messageInput.addEventListener("blur", validateMessage)


// =====================
// FORM SUBMIT
// =====================

form.addEventListener("submit", async (e) => {

  e.preventDefault()


  // honeypot spam protection

  if (honeypot.value !== "") {

    console.log("Spam detected")

    return

  }


  const valid =

    validateName() &&
    validatePhone() &&
    validateEmail() &&
    validateMessage() &&
    validateService()

  if (!valid) return


  const submitBtn = form.querySelector("button[type='submit']")
  const caption = submitBtn.querySelector(".btn-caption")

  if (submitBtn.disabled) return

  submitBtn.disabled = true
  submitBtn.classList.add("btn-loading")

  const originalText = caption.textContent

  caption.textContent = "Sending..."


  // collect data

  const data = {

    Name: nameInput.value.trim(),
    Company: companyInput.value.trim(),
    E_mail: emailInput.value.trim(),
    Phone: phoneInput.value,
    Service: serviceSelect.value,
    OtherService: serviceSelect.value === "Other" ? otherServiceInput.value.trim() : "",
    Message: messageInput.value.trim()

  }


  // fake delay for better UX (1 sec smooth)

  await new Promise(r => setTimeout(r, 700))


  try {
   const controller = new AbortController();
   const timeout = setTimeout(() => controller.abort(), 25000);

    // Determine API URL based on environment
   const apiUrl = window.location.hostname === 'localhost' 
      ? '/api/contact'  // Local: use relative path to local server
      : 'https://webfusion-backend-x422.onrender.com/api/contact'; // Production: use Render backend

   const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    clearTimeout(timeout);

    // LOCAL DEVELOPMENT ENDPOINT (commented out - for reference only)
    // const response = await fetch(
    //   "/api/contact",
    //   {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(data),
    //     signal: controller.signal
    //   }
    // );
    // clearTimeout(timeout);

    const result = await response.json()

    if (!response.ok) {

      throw new Error(result.error || "Server error")

    }


    // success animation

    form.reset()

    otherServiceContainer.style.display = "none"

    submitBtn.classList.remove("btn-loading")

    caption.textContent = "Sent ✓"

    showToast("Message sent successfully 🚀", "success")

    setTimeout(() => {

      submitBtn.disabled = false
      caption.textContent = originalText

    }, 2000)

  } catch (err) {

    console.error(err)

    showToast(err.message || "Failed to send message", "error")

    submitBtn.disabled = false
    submitBtn.classList.remove("btn-loading")

    caption.textContent = originalText

  }

})