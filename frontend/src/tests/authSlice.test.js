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
  dispatch: jest.fn()
}));

import { configureStore } from '@reduxjs/toolkit';
import authReducer, { logout } from '../store/slices/authSlice';

describe('authSlice', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  test('initial state has null token and user', () => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: { auth: { token: null, user: null, loading: false, error: null } }
    });
    expect(store.getState().auth.token).toBeNull();
    expect(store.getState().auth.user).toBeNull();
  });

  test('logout clears token and user from state', () => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: { token: 'fake.jwt.token', user: { id: 'MYFIN-CUST-0001', name: 'Test', role: 'CUSTOMER' }, loading: false, error: null }
      }
    });
    store.dispatch(logout());
    expect(store.getState().auth.token).toBeNull();
    expect(store.getState().auth.user).toBeNull();
  });

  test('logout removes token from localStorage', () => {
    localStorage.setItem('myfin_token', 'some-token');
    localStorage.setItem('myfin_user', JSON.stringify({ id: '1' }));
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: { auth: { token: 'some-token', user: { id: '1' }, loading: false, error: null } }
    });
    store.dispatch(logout());
    expect(localStorage.getItem('myfin_token')).toBeNull();
    expect(localStorage.getItem('myfin_user')).toBeNull();
  });

  test('loading is false in initial state', () => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: { auth: { token: null, user: null, loading: false, error: null } }
    });
    expect(store.getState().auth.loading).toBe(false);
  });

  test('error is null in initial state', () => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: { auth: { token: null, user: null, loading: false, error: null } }
    });
    expect(store.getState().auth.error).toBeNull();
  });

});