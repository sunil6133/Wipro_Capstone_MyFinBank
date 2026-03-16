jest.mock('../utils/axiosInstance', () => ({
  default: {
    post: jest.fn(),
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }
}));

jest.mock('../store', () => ({
  getState: () => ({ auth: { token: null } }),
  dispatch: jest.fn(),
  subscribe: jest.fn()
}));

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() }
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import Login from '../pages/Login';
import authReducer from '../store/slices/authSlice';

const renderLogin = () => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { token: null, user: null, loading: false, error: null } }
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </Provider>
  );
};

describe('Login Page', () => {
  test('renders MyFin Bank heading', () => {
    renderLogin();
    expect(screen.getByText('MyFin Bank')).toBeInTheDocument();
  });

  test('renders Customer and Admin toggle buttons', () => {
    renderLogin();
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  test('renders email and password fields', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your password')).toBeInTheDocument();
  });

  test('shows Forgot Password and Create Account links for Customer tab', () => {
    renderLogin();
    expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  test('hides Forgot Password and Create Account when Admin tab selected', () => {
    renderLogin();
    fireEvent.click(screen.getByText('Admin'));
    expect(screen.queryByText('Forgot Password?')).not.toBeInTheDocument();
    expect(screen.queryByText('Create Account')).not.toBeInTheDocument();
  });

  test('shows validation error when submitting empty form', async () => {
    renderLogin();
    fireEvent.click(screen.getByText('Sign In'));
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  test('shows validation error for invalid email', async () => {
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'notanemail' }
    });
    fireEvent.click(screen.getByText('Sign In'));
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  test('renders Sign In button', () => {
    renderLogin();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  test('switches to Admin mode when Admin button clicked', () => {
    renderLogin();
    const adminBtn = screen.getByText('Admin');
    fireEvent.click(adminBtn);
    expect(screen.queryByText('Forgot Password?')).not.toBeInTheDocument();
  });
});