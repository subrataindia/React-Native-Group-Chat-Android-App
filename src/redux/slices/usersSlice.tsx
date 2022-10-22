import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import firestore from '@react-native-firebase/firestore';
import {Constants} from '../../settings/config';

type ResultType = {
  name: string;
  email: string;
  uid: string;
};

type StoreStateType = {
  users: ResultType[];
  usersStatus: string;
  usersError: string;
};

export const getAllUsers = createAsyncThunk('users/getallusers', async () => {
  console.log('Started getting user data');
  let result: ResultType[] = [];
  const usersQuerySnapshot = await firestore().collection('Users').get();

  usersQuerySnapshot.forEach(documentSnapshot => {
    result.push({
      uid: documentSnapshot.data().uid,
      name: documentSnapshot.data().name,
      email: documentSnapshot.data().email,
    });
  });

  return result;
});

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    usersStatus: Constants.IDLE,
    usersError: 'Unknown Error Occured!',
  } as StoreStateType,
  reducers: {
    resetUsersStatus: state => {
      state.usersStatus = Constants.IDLE;
      state.usersError = 'Unknown Error Occured!';
    },
    resetUsersData: state => {
      state.users = [];
      state.usersStatus = Constants.IDLE;
      state.usersError = 'Unknown Error Occured!';
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getAllUsers.pending, state => {
        state.usersStatus = Constants.LOADING;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.usersStatus = Constants.FULFILLED;
        state.users = action.payload;
        console.log('getAllUsers fulfilled', action);
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.usersStatus = Constants.REJECTED;
        action?.error?.message && (state.usersError = action?.error?.message);
        console.log('getAllUsers Rejected', action);
      });
  },
});

export const {resetUsersStatus, resetUsersData} = usersSlice.actions;
export default usersSlice.reducer;
