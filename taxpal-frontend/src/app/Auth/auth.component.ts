import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-auth',
  standalone:true,
  imports:[CommonModule,
          FormsModule],

  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent {

    
  // ==========================================
  // LOGIN / REGISTER MODE
  // ==========================================

  // false = Login
  // true = Register

  isRegisterMode: boolean = false;

  //FORGOT PASSWORD MODE

  isForgotPasswordMode: boolean = false;


  // ==========================================
  // PASSWORD VISIBILITY
  // ==========================================

  showLoginPassword: boolean = false;

  showRegisterPassword: boolean = false;

  showConfirmPassword: boolean = false;


  // ==========================================
  // REMEMBER ME
  // ==========================================

  rememberMe: boolean = false;


  // ==========================================
  // LOGIN DATA
  // ==========================================

  loginData = {
    username: '',
    password: ''
  };

  // ==========================================
  // FORGOT PASSWORD DATA
  // ==========================================

forgotPasswordEmail: string = '';

  // ==========================================
  // REGISTRATION DATA
  // ==========================================

  registerData = {

    username: '',

    email: '',

    password: '',

    confirmPassword: '',

    country: '',

    incomeBracket: '',

    agreeTerms: false

  };


  // ==========================================
  // SHOW REGISTER FORM
  // ==========================================

  showRegister(event?: Event): void {

    // Prevent <a href="#"> from refreshing page
    if (event) {
      event.preventDefault();
    }

    // Change to Register mode
    this.isRegisterMode = true;
    this.isForgotPasswordMode =false;

  }


  // ==========================================
  // SHOW LOGIN FORM
  // ==========================================

  showLogin(event?: Event): void {

    // Prevent <a href="#"> from refreshing page
    if (event) {
      event.preventDefault();
    }

    // Change to Login mode
    this.isRegisterMode = false;
    this.isForgotPasswordMode = false;

  }



  // ==========================================
  // SHOW / HIDE LOGIN PASSWORD
  // ==========================================

  toggleLoginPassword(): void {

    this.showLoginPassword =
      !this.showLoginPassword;

  }


  // ==========================================
  // SHOW / HIDE REGISTER PASSWORD
  // ==========================================

  toggleRegisterPassword(): void {

    this.showRegisterPassword =
      !this.showRegisterPassword;

  }


  // ==========================================
  // SHOW / HIDE CONFIRM PASSWORD
  // ==========================================

  toggleConfirmPassword(): void {

    this.showConfirmPassword =
      !this.showConfirmPassword;

  }


  // ==========================================
  // LOGIN
  // ==========================================

  login(): void {

    // Check username
    if (!this.loginData.username.trim()) {

      alert('Please enter your username.');

      return;

    }


    // Check password
    if (!this.loginData.password) {

      alert('Please enter your password.');

      return;

    }


    // Display data in browser console
    console.log('Login Data:', this.loginData);

    console.log(
      'Remember Me:',
      this.rememberMe
    );


    // Temporary message
    alert(
      'Login successfully!'
    );





  }


  // ==========================================
  // REGISTER
  // ==========================================

  register(): void {

    // Check username
    if (!this.registerData.username.trim()) {

      alert(
        'Please enter your username.'
      );

      return;

    }


    // Check email
    if (!this.registerData.email.trim()) {

      alert(
        'Please enter your email address.'
      );

      return;

    }


    // Check password
    if (!this.registerData.password) {

      alert(
        'Please enter your password.'
      );

      return;

    }


    // Check confirm password
    if (!this.registerData.confirmPassword) {

      alert(
        'Please confirm your password.'
      );

      return;

    }


    // Check password matching
    if (
      this.registerData.password !==
      this.registerData.confirmPassword
    ) {

      alert(
        'Passwords do not match!'
      );

      return;

    }


    // Check country
    if (!this.registerData.country) {

      alert(
        'Please select your country.'
      );

      return;

    }


    // Check income bracket
    if (!this.registerData.incomeBracket) {

      alert(
        'Please select your income bracket.'
      );

      return;

    }


    // Check Terms and Privacy Policy
    if (!this.registerData.agreeTerms) {

      alert(
        'Please agree to the Terms of Service and Privacy Policy.'
      );

      return;

    }


    // Display registration data
    console.log(
      'Registration Data:',
      this.registerData
    );


    // Temporary success message
    alert(
      'Account created successfully!'
    );


    // Switch back to Login page
    this.showLogin();


    // Clear registration form
    this.resetRegistrationForm();

  }

  // ==========================================
// SHOW FORGOT PASSWORD FORM
// ==========================================

forgotPassword(event: Event): void {

  // Prevent page refresh
  event.preventDefault();

  // Open Forgot Password page
  this.isForgotPasswordMode = true;

  // Make sure Register mode is off
  this.isRegisterMode = false;

}



  // ==========================================
 // SUBMIT FORGOT PASSWORD FORM
 // ==========================================

forgotPasswordSubmit(): void {

  // Check email
  if (!this.forgotPasswordEmail.trim()) {

    alert('Please enter your email address.');

    return;

  }

  // Display email in browser console
  console.log(
    'Forgot Password Email:',
    this.forgotPasswordEmail
  );

  // Temporary success message
  alert(
    'Password reset link  has been sent to your email address.'
  );


}


  // ==========================================
  // RESET REGISTRATION FORM
  // ==========================================

  resetRegistrationForm(): void {

    this.registerData = {

      username: '',

      email: '',

      password: '',

      confirmPassword: '',

      country: '',

      incomeBracket: '',

      agreeTerms: false

    };


    // Hide passwords again

    this.showRegisterPassword = false;

    this.showConfirmPassword = false;

  }


  // ==========================================
  // RESET LOGIN FORM
  // ==========================================

  resetLoginForm(): void {

    this.loginData = {

      username: '',

      password: ''

    };


    this.rememberMe = false;

    this.showLoginPassword = false;

  }

}
