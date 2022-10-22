import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {Constants} from '../../settings/config';

type signUpDataType = {
  email: string;
  password: string;
  displayName: string;
};

type signInDataType = {
  email: string;
  password: string;
};

export const signIn = createAsyncThunk(
  'user/signin',
  async (data: signInDataType) => {
    console.log('Sign in Started', data.email, data.password);
    const userData = await auth().signInWithEmailAndPassword(
      data.email,
      data.password,
    );
    console.log(userData);
  },
);

export const signUp = createAsyncThunk(
  'user/signup',
  async (data: signUpDataType) => {
    console.log('Sign in Started', data.email, data.password);
    const userData = await auth().createUserWithEmailAndPassword(
      data.email,
      data.password,
    );
    const user = auth().currentUser;
    await user?.updateProfile({
      displayName: data.displayName,
    });

    await firestore()
      .collection('Users')
      .doc('' + user?.uid)
      .set({
        name: data.displayName,
        email: data.email,
        uid: user?.uid,
      });

    return true;
  },
);

export const signOut = createAsyncThunk('user/signout', async () => {
  await auth().signOut();
  return null;
});

const getInitialUser = () => {
  const u = auth().currentUser;
  if (u === null) return null;
  return {displayName: u.displayName, uid: u.uid, email: u.email};
};

const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: getInitialUser(),
    userStatus: Constants.IDLE,
    userError: 'Unknown Error Occured!',
    signOutStatus: Constants.IDLE,
    signOutError: 'Unknown Error Occured!',
  },
  reducers: {
    resetUserState: state => {
      state.userStatus = Constants.IDLE;
      state.signOutStatus = Constants.IDLE;
      state.userError = 'Unknown Error Occured!';
    },
  },
  extraReducers(builder) {
    builder
      .addCase(signIn.pending, (state, action) => {
        state.userStatus = Constants.LOADING;
        console.log('Pending');
      })
      .addCase(signIn.fulfilled, state => {
        state.userStatus = Constants.FULFILLED;
        state.user = getInitialUser();
        console.log('SignIn Fulfilled');
      })
      .addCase(signIn.rejected, (state, action) => {
        state.userStatus = Constants.REJECTED;
        if (action.error.code === 'auth/user-not-found') {
          state.userError = 'No user found for the given credentials.';
        } else {
          action?.error?.message && (state.userError = action.error.message);
        }
        console.log('Rejected', action.error.message);
      })
      .addCase(signUp.pending, (state, action) => {
        state.userStatus = Constants.LOADING;
        console.log('Pending');
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.userStatus = Constants.FULFILLED;
        state.user = getInitialUser();
        console.log('Signup Fulfilled', action);
      })
      .addCase(signUp.rejected, (state, action) => {
        state.userStatus = Constants.REJECTED;
        if (action.error.code === 'auth/email-already-in-use') {
          state.userError = 'The email address is already in use.';
        } else {
          action?.error?.message && (state.userError = action.error.message);
        }
        console.log('Rejected', action.error.message);
      })
      .addCase(signOut.pending, state => {
        state.signOutStatus = Constants.LOADING;
        console.log('Pending');
      })
      .addCase(signOut.fulfilled, state => {
        state.signOutStatus = Constants.FULFILLED;
        state.user = null;
        console.log('Fulfilled');
      })
      .addCase(signOut.rejected, (state, action) => {
        state.signOutStatus = Constants.REJECTED;
        action?.error?.message && (state.signOutError = action.error.message);
        console.log('Signout Rejected', action.error.message);
      });
  },
});

export const {resetUserState} = userSlice.actions;
export default userSlice.reducer;
