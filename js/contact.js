const form = document.getElementById("contact-form");
const phoneInput = document.querySelector('input[name="Phone"]');
const emailInput = document.querySelector('input[name="E_mail"]');

// Regex patterns
const phoneRegex = /^\d{10}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// Real-time validation functions
function validatePhone(value) {
  if (!value) return { valid: true }; // Phone is not required
  if (!phoneRegex.test(value)) {
    return { 
      valid: false, 
      message: 'Please enter exactly 10 digits' 
    };
  }
  return { valid: true };
}

function validateEmail(value) {
  if (!value) return { valid: false, message: 'Email is required' };
  if (!emailRegex.test(value)) {
    return { 
      valid: false, 
      message: 'Please enter a valid email address' 
    };
  }
  if (!value.includes('@gmail.com') && !value.includes('@webfusionexperts.in')) {
    return { 
      valid: false, 
      message: 'Please use @gmail.com or @webfusionexperts.in email' 
    };
  }
  return { valid: true };
}

// Show/hide error messages
function showError(element, message) {
  element.style.display = 'block';
  element.textContent = message;
  element.previousElementSibling.style.borderColor = '#f44336';
}

function hideError(element) {
  element.style.display = 'none';
  element.previousElementSibling.style.borderColor = '';
}

// Real-time validation listeners
phoneInput.addEventListener('input', function() {
  const result = validatePhone(this.value);
  if (result.valid) {
    hideError(phoneError);
  } else {
    showError(phoneError, result.message);
  }
});

phoneInput.addEventListener('blur', function() {
  const result = validatePhone(this.value);
  if (!result.valid && this.value) {
    showError(phoneError, result.message);
  }
});

emailInput.addEventListener('input', function() {
  const result = validateEmail(this.value);
  if (result.valid) {
    hideError(emailError);
  } else {
    showError(emailError, result.message);
  }
});

emailInput.addEventListener('blur', function() {
  const result = validateEmail(this.value);
  if (!result.valid) {
    showError(emailError, result.message);
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Validate all fields before submission
  const phoneResult = validatePhone(phoneInput.value);
  const emailResult = validateEmail(emailInput.value);
  
  // Show all errors
  if (!phoneResult.valid) {
    showError(phoneError, phoneResult.message);
  }
  if (!emailResult.valid) {
    showError(emailError, emailResult.message);
  }
  
  // If any validation fails, don't submit
  if (!phoneResult.valid || !emailResult.valid) {
    return;
  }

  // Show loading state
  const submitButton = form.querySelector('button[type="submit"]');
  const captionElement = submitButton.querySelector('.btn-caption');
  const originalText = captionElement.textContent;
  
  // Prevent double submission
  if (submitButton.disabled) return;
  
  // Temporarily disable animation to prevent text duplication
  submitButton.classList.add('no-animation');
  
  // Remove old loading overlay
  form.classList.remove('form-loading');
  captionElement.textContent = 'Sending...';
  submitButton.disabled = true;

  const formData = new FormData(form);

  const data = {
    Name: formData.get("Name"),
    Company: formData.get("Company"),
    E_mail: formData.get("E_mail"),
    Phone: formData.get("Phone"),
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
      // Show success toast for only 2 seconds
      showSuccess("Message sent successfully! We'll get back to you soon.", 2000);
      
      // Reset form properly
      form.reset();
      
      // Clear all form fields manually as backup
      const formFields = form.querySelectorAll('input, textarea');
      formFields.forEach(field => {
        if (field.type !== 'hidden') {
          field.value = '';
        }
      });
      
      // Hide form reply message if it exists
      const replyMessage = document.querySelector('.form__reply');
      if (replyMessage) {
        replyMessage.classList.add('is-visible');
        setTimeout(() => {
          replyMessage.classList.remove('is-visible');
        }, 2000);
      }
      
      // Clear validation errors
      hideError(phoneError);
      hideError(emailError);
      

    } else {
      // Show error toast with specific message
      showError(` ${result.error || "Something went wrong!"}`);
    }
  } catch (error) {
    console.error("Contact form error:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    // Show specific error message based on the error type
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      showError(" Network error. Please check your internet connection.");
    } else if (error.message && error.message.includes("Contact service unavailable")) {
      showError(" Contact service is temporarily unavailable. Please try again later.");
    } else {
      showError(`Server error: ${error.message || "Please try again later."}`);
    }
  } finally {
    // Remove loading state
    form.classList.remove('form-loading');
    if (captionElement) {
      captionElement.textContent = originalText;
    }
    submitButton.disabled = false;
    // Remove temporary animation disabling class
    submitButton.classList.remove('no-animation');
  }
});
