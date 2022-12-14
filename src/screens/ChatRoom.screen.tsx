import {useNavigation, useRoute} from '@react-navigation/native';
import React, {useEffect, useRef, useState} from 'react';
import {View, Image, Text, StyleSheet, FlatList} from 'react-native';
import {MazicTextInput} from 'react-native-mazic-components';
import CustomButton from '../components/CustomButton';
import {Header} from 'react-native/Libraries/NewAppScreen';
import man1 from '../assets/img/man1.png';
import {deviceHeight, ThemeColors} from '../settings/config';
import {shadows} from '../styles/shadows';
import LikeButton from '../components/LikeButton';
import {globalStyle} from '../styles/global';
import CustomTextInput from '../components/CustomTextInput';
import {setChatMessages, useAppDispatch, writeMessage} from '../redux/store';
import {useSelector} from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import {SingleChatMessageType} from '../settings/types';
import style from './ChatRoom.style';

const ChatRoom = () => {
  const [message, setMessage] = useState('');
  const [likes, setLikes] = useState(0);

  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const {u} = useRoute().params;
  const {user} = useSelector((state: any) => state.userReducer);
  const {chatMessages, writeMessageStatus, writeMessageError} = useSelector(
    (state: any) => state.chatMessageReducer,
  );

  const ImageHeader = (props: any) => {
    return (
      <View style={globalStyle.headerTitleContainer}>
        <Image source={man1} style={{width: 40, height: 40}} />
        <Text style={globalStyle.headerTitle}>{u.name}</Text>
      </View>
    );
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: props => <ImageHeader {...props} />,
      headerTitleStyle: {flex: 1, textAlign: 'center'},
    });
  }, [u]);

  useEffect(() => {
    const firestoremessagecollection = firestore()
      .collection('Messages')
      .where('receivedId', 'in', [u.uid, user.uid]);

    return firestoremessagecollection.onSnapshot(querySnapshot => {
      if (querySnapshot !== null) {
        let result: SingleChatMessageType[] = [];
        querySnapshot.forEach(documentSnapshot => {
          const data = documentSnapshot.data();
          result.push(data);
        });
        result = result.filter(
          a => a.sentId === u.uid || a.sentId === user.uid,
        );
        result.sort((a, b) => a.createdAt - b.createdAt);
        dispatch(setChatMessages(result));
      }
    });
  }, []);

  const sendMessage = () => {
    dispatch(
      writeMessage({
        text: message,
        receivedId: u.uid,
        sentId: user.uid,
        createdAt: Date.now(),
        groupId: null,
        likes: [],
      }),
    );
    setMessage('');
  };

  const SingleChatMessage = ({item}) =>
    item.sentId === user.uid ? (
      <View style={style.sentMessage}>
        <Text>{item.text}</Text>
        {/* <LikeButton disabled={true} position={'right'} setValue={() => {}} /> */}
        <View style={style.rightTriangle}></View>
      </View>
    ) : (
      <View style={style.receivedMessage}>
        <Text>{item.text}</Text>
        {/* <LikeButton value={likes} setValue={() => setLikes(prev => prev + 1)} /> */}
        <View style={style.leftTriangle}></View>
      </View>
    );

  return (
    <View style={{flex: 1}}>
      <View style={{flex: 1, margin: 10}}>
        <FlatList
          data={chatMessages}
          inverted
          contentContainerStyle={{flexDirection: 'column-reverse'}}
          renderItem={item => <SingleChatMessage item={item.item} />}
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          padding: 2,
          margin: 5,
          backgroundColor: '#fff',
          borderRadius: 20,
          ...shadows,
        }}>
        <View style={{flex: 1}}>
          <CustomTextInput
            placeholder="Write Message Here"
            value={message}
            setValue={setMessage}
            hideTitle={true}
            style={{borderRadius: 20}}
            w={'100%'}
          />
        </View>
        <View style={{marginLeft: 10}}>
          <CustomButton
            onPressFn={sendMessage}
            bgc={ThemeColors.primary}
            rightIcon="send"
          />
        </View>
      </View>
    </View>
  );
};

export default ChatRoom;
