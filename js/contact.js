const form = document.getElementById("contact-form");
const phoneInput = document.querySelector('input[name="Phone"]');
const emailInput = document.querySelector('input[name="E_mail"]');
const serviceSelect = document.getElementById('service-select');
const otherServiceContainer = document.getElementById('other-service-container');
const otherServiceInput = document.getElementById('other-service-input');

// Regex patterns

// Name Regex

const nameRegex = /^[A-Za-z\s]{2,50}$/;

function validateName(value) {
  if (!nameRegex.test(value)) {
    return { valid: false, message: "Enter valid name (only letters)" };
  }
  return { valid: true };
}

// Message Regex
function validateMessage(value) {
  if (value.length < 10) {
    return { valid: false, message: "Message must be at least 10 characters" };
  }
  return { valid: true };
}


// Phone Number - Limit to exactly 10 digits
phoneInput.addEventListener('input', function() {
  // Remove any non-digit characters
  this.value = this.value.replace(/\D/g, '');
  
  // Limit to 10 digits only
  if (this.value.length > 10) {
    this.value = this.value.slice(0, 10);
  }
});

// Prevent non-digit key presses for phone
phoneInput.addEventListener('keydown', function(e) {
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
  if (!allowedKeys.includes(e.key) && !/^[0-9]$/.test(e.key)) {
    e.preventDefault();
  }
});

// Phone Number Regex
const phoneRegex = /^\d{10}$/;

// Create error message elements
function createErrorElement(input) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.style.cssText = `
    color: #f44336;
    font-size: 14px;
    margin-top: 5px;
    display: none;
  `;
  input.parentNode.appendChild(errorDiv);
  return errorDiv;
}

// Initialize error elements
const phoneError = createErrorElement(phoneInput);
const emailError = createErrorElement(emailInput);
const messageInput = document.querySelector('textarea[name="Message"]');
const messageError = messageInput ? createErrorElement(messageInput) : null;
const nameInput = document.querySelector('input[name="Name"]');
const nameError = createErrorElement(nameInput);
const companyInput = document.querySelector('input[name="Company"]');
const companyError = createErrorElement(companyInput);
const serviceError = createErrorElement(serviceSelect);

// Real-time validation functions
function validatePhone(value) {
  if (!value) {
    return { valid: false, message: 'Phone number is required' };
  }
  if (!phoneRegex.test(value)) {
    return {
      valid: false,
      message: 'Please enter exactly 10 digits'
    };
  }
  return { valid: true };
}

// Email Regex (Only gmail.com & webfusionexperts.in allowed)
const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|webfusionexperts\.in)$/;

function validateEmail(value) {
  if (!value) {
    return {
      valid: false,
      message: 'Email is required'
    };
  }

  if (!emailRegex.test(value)) {
    return {
      valid: false,
      message: 'Please use a valid @gmail.com or @webfusionexperts.in email'
    };
  }

  return { valid: true };
}
// Show/hide error messages
function showError(element, message) {
  if (element && element.style) {
    element.style.display = 'block';
    element.textContent = message;
    if (element.previousElementSibling) {
      element.previousElementSibling.style.borderColor = '#f44336';
    }
  }
}

function hideError(element) {
  if (element && element.style) {
    element.style.display = 'none';
    if (element.previousElementSibling) {
      element.previousElementSibling.style.borderColor = '';
    }
  }
}

// Real-time validation listeners
phoneInput.addEventListener('input', function () {
  const result = validatePhone(this.value);
  if (result.valid) {
    hideError(phoneError);
  } else {
    showError(phoneError, result.message);
  }
});

phoneInput.addEventListener('blur', function () {
  const result = validatePhone(this.value);
  if (!result.valid && this.value) {
    showError(phoneError, result.message);
  }
});

emailInput.addEventListener('input', function () {
  const result = validateEmail(this.value);
  if (result.valid) {
    hideError(emailError);
  } else {
    showError(emailError, result.message);
  }
});

emailInput.addEventListener('blur', function () {
  const result = validateEmail(this.value);
  if (!result.valid) {
    showError(emailError, result.message);
  }
});

// Service dropdown change handler
if (serviceSelect) {
  serviceSelect.addEventListener('change', function() {
    if (this.value === 'Other') {
      otherServiceContainer.style.display = 'block';
      otherServiceInput.required = true;
      otherServiceInput.focus();
    } else {
      otherServiceContainer.style.display = 'none';
      otherServiceInput.required = false;
      otherServiceInput.value = '';
    }
  });
}

// Message real-time validation
if (messageInput) {
  messageInput.addEventListener('input', function () {
    const result = validateMessage(this.value);
    if (result.valid) {
      hideError(messageError);
    } else if (this.value.length > 0) {
      showError(messageError, result.message);
    }
  });
  
  messageInput.addEventListener('blur', function () {
    if (this.value.length > 0 && this.value.length < 10) {
      showError(messageError, 'Message must be at least 10 characters');
    }
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Validate all fields before submission
  const nameResult = validateName(nameInput.value);
  const phoneResult = validatePhone(phoneInput.value);
  const emailResult = validateEmail(emailInput.value);
  const messageResult = validateMessage(messageInput.value);
  const serviceValue = serviceSelect.value;
  const otherServiceValue = otherServiceInput.value;

  // Show all errors
  if (!nameResult.valid) {
    showError(nameError, nameResult.message);
  } else {
    hideError(nameError);
  }
  
  if (!phoneResult.valid) {
    showError(phoneError, phoneResult.message);
  } else {
    hideError(phoneError);
  }
  
  if (!emailResult.valid) {
    showError(emailError, emailResult.message);
  } else {
    hideError(emailError);
  }
  
  if (!messageResult.valid && messageInput.value.length > 0) {
    showError(messageError, messageResult.message);
  } else if (messageInput.value.length === 0) {
    showError(messageError, 'Message is required');
  } else {
    hideError(messageError);
  }
  
  // Validate service selection
  if (!serviceValue) {
    showError(serviceError, 'Please select a service');
  } else {
    hideError(serviceError);
  }
  
  // Validate other service if selected
  if (serviceValue === 'Other' && !otherServiceValue.trim()) {
    const otherServiceError = createErrorElement(otherServiceInput);
    showError(otherServiceError, 'Please specify the service');
  }

  // If any validation fails, don't submit
  if (!nameResult.valid || !phoneResult.valid || !emailResult.valid || 
      (!messageResult.valid && messageInput.value.length > 0) || !serviceValue ||
      (serviceValue === 'Other' && !otherServiceValue.trim())) {
    return;
  }

  // Show loading state
  const submitButton = form.querySelector('button[type="submit"]');
  const captionElement = submitButton.querySelector('.btn-caption');
  
  // Prevent double submission
  if (submitButton.disabled) return;
  
  // Disable button immediately to prevent multiple clicks
  submitButton.disabled = true;
  
  // Add loading class for visual feedback
  submitButton.classList.add('btn-loading');
  
  // Store original text and change to sending
  const originalText = captionElement.textContent.trim();
  captionElement.textContent = 'Sending...';

  const formData = new FormData(form);

  const data = {
    Name: formData.get("Name"),
    Company: formData.get("Company"),
    E_mail: formData.get("E_mail"),
    Phone: formData.get("Phone"),
    Service: serviceValue,
    OtherService: serviceValue === 'Other' ? otherServiceValue : '',
    Message: formData.get("Message"),
  };

  try {
    // Log the complete request

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });



    // First check if response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Response error text:", errorText);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    // Check if response has content
    const contentLength = response.headers.get("content-length");

    const responseText = await response.text();

    // Check if response is empty
    if (!responseText || responseText.trim() === "") {
      throw new Error("Empty response from server");
    }

    // Try to parse JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (jsonError) {
      console.error("JSON parsing failed:", jsonError);
      throw new Error(`Invalid JSON response: ${jsonError.message}`);
    }

    if (response.ok) {
      // Show success toast for 2 seconds
      showSuccess("Message sent successfully! We'll get back to you soon.", 4000);

      // Keep button disabled and reload page
      setTimeout(() => {
        window.location.reload();
      }, 2500);

    } else {
      // Show error toast with specific message
      showError(` ${result.error || "Something went wrong!"}`);
    }
  } catch (error) {
    console.error("Contact form error:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    // Re-enable button on error so user can try again
    submitButton.disabled = false;
    submitButton.classList.remove('btn-loading');
    captionElement.textContent = originalText;
    
    // Show specific error message based on the error type
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      showError(" Network error. Please check your internet connection.");
    } else if (error.message && error.message.includes("Contact service unavailable")) {
      showError(" Contact service is temporarily unavailable. Please try again later.");
    } else {
      showError(`Server error: ${error.message || "Please try again later."}`);
    }
  }
});
