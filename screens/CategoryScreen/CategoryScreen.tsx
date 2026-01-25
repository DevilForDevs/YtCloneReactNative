import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useVideoStoreForSearch } from '../../utils/Store';



type NavigationProp = RouteProp<
    RootStackParamList,
    "CommanScreen"
>;

export default function CategoryScreen() {

    const navigation = useNavigation<navStack>();
    const route = useRoute<NavigationProp>();
    const { site } = route.params;

    const {
        totalVideos,
        addVideo,
        clearVideos,
        setQuery,
        query,
    } = useVideoStoreForSearch();

    useEffect(() => {
        loadCategories();
    }, []);



    const loadCategories = async () => {

    };

    return (
        <View>
            <Text>CategoryScreen</Text>
        </View>
    )
}

const styles = StyleSheet.create({})