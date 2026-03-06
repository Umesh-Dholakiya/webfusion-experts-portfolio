// Subscription Form Handler
document.addEventListener('DOMContentLoaded', function() {
  const subscribeForms = document.querySelectorAll('.notify-form');
  
  subscribeForms.forEach(form => {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const emailInput = form.querySelector('input[type="email"]');
      const submitButton = form.querySelector('button[type="submit"]');
      const email = emailInput.value.trim();
      
      // Validate email
      if (!email) {
        showSubscribeError(form, 'Email is required');
        return;
      }
      
      const emailRegex = /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        showSubscribeError(form, 'Please enter a valid email address');
        return;
      }
      
      // Show loading state
      const originalIcon = submitButton.innerHTML;
      submitButton.innerHTML = '<i class="ph ph-spinner"></i>';
      submitButton.disabled = true;
      
      try {
        const response = await fetch('/api/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          // Show success message
          showSubscribeSuccess(form);
          emailInput.value = '';
          console.log('✅ Subscription successful:', result.message);
        } else {
          // Show error message
          showSubscribeError(form, result.error || 'Subscription failed');
        }
      } catch (error) {
        console.error('Subscription error:', error);
        showSubscribeError(form, 'Network error. Please try again.');
      } finally {
        // Reset button
        submitButton.innerHTML = originalIcon;
        submitButton.disabled = false;
      }
    });
  });
  
  function showSubscribeSuccess(form) {
    const formContainer = form.closest('.form-container');
    const successMessage = formContainer.querySelector('.subscription-ok');
    
    if (successMessage) {
      form.classList.add('is-hidden');
      successMessage.classList.add('is-visible');
      
      setTimeout(() => {
        successMessage.classList.remove('is-visible');
        form.classList.remove('is-hidden');
        form.reset();
      }, 5000);
    }
  }
  
  function showSubscribeError(form, message) {
    const formContainer = form.closest('.form-container');
    const errorMessage = formContainer.querySelector('.subscription-error');
    
    if (errorMessage) {
      const errorText = errorMessage.querySelector('.reply__text');
      if (errorText) {
        errorText.textContent = message;
      }
      
      form.classList.add('is-hidden');
      errorMessage.classList.add('is-visible');
      
      setTimeout(() => {
        errorMessage.classList.remove('is-visible');
        form.classList.remove('is-hidden');
      }, 5000);
    }
  }
});
