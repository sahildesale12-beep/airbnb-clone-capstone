import { configureStore } from '@reduxjs/toolkit';
import listingsReducer from './listingsSlice';
import bookingsReducer from './bookingsSlice';

export const store = configureStore({ reducer: { listings: listingsReducer, bookings: bookingsReducer } });
