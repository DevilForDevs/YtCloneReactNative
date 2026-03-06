import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useNavigation } from "@react-navigation/native";
import { getNewsPapers } from './backends/apis';
import { SafeAreaView } from 'react-native-safe-area-context';
import { initDB } from '../../utils/dbfunctions';


export default function TOI() {
    const [sections, setSections] = useState<Section[]>([])
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
    const navigation = useNavigation<navStack>();

    async function loadItems() {
        const db = await initDB()
        const result = await getNewsPapers(db);
        setSections(result)
    }

    useEffect(() => {
        loadItems()
    }, [])

    const toggleSection = (title: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [title]: !prev[title]
        }))
    }

    async function handleItemClickToday(item: sectionItem) {
        navigation.navigate("FetchImagesForPdf", {
            item: {
                url: item.link ?? "cap",
                day: "today",
                edition: item.value ?? "cap",
                editionName: item.label
            }
        })

    }

    async function handleItemClickYesterday(item: sectionItem) {
        navigation.navigate("FetchImagesForPdf", {
            item: {
                url: item.value ?? "cap",
                day: "yesterday",
                edition: item.value ?? "cap"
            }
        })

    }

    const renderItem = ({ item }: { item: sectionItem }) => (
        <View style={styles.itemContainer}>
            <Text style={styles.itemText}>{item.label}</Text>

            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={styles.todayBtn}
                    onPress={() => handleItemClickToday(item)}
                >
                    <Text style={styles.todayText}>Today</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.yesterdayBtn}
                    onPress={() => handleItemClickYesterday(item)}
                >
                    <Text style={styles.yesterdayText}>Yesterday</Text>
                </TouchableOpacity>
            </View>
        </View>
    )

    const renderSection = ({ item }: { item: Section }) => {
        const isExpanded = expandedSections[item.title]
        const visibleItems = isExpanded ? item.items : item.items.slice(0, 5)

        return (
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>{item.title}</Text>

                <FlatList
                    data={visibleItems}
                    keyExtractor={(item, index) => item.label + index}
                    renderItem={renderItem}
                    scrollEnabled={false}
                />

                {item.items.length > 5 && (
                    <TouchableOpacity
                        style={styles.viewMoreBtn}
                        onPress={() => toggleSection(item.title)}
                    >
                        <Text style={styles.viewMoreText}>
                            {isExpanded ? "View Less" : "View More"}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        )
    }

    return (
        <SafeAreaView>
            <FlatList
                data={sections}
                keyExtractor={(item, index) => item.title + index}
                renderItem={renderSection}
                contentContainerStyle={styles.container}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16
    },
    sectionContainer: {
        marginBottom: 24
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10
    },
    itemContainer: {
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    itemText: {
        fontSize: 15,
        flex: 1
    },
    actionsContainer: {
        flexDirection: "row",
        gap: 10
    },
    todayBtn: {
        backgroundColor: "#007bff",
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 6
    },
    yesterdayBtn: {
        backgroundColor: "#6c757d",
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 6
    },
    todayText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "600"
    },
    yesterdayText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "600"
    },
    viewMoreBtn: {
        marginTop: 8,
        paddingVertical: 6
    },
    viewMoreText: {
        color: "#007bff",
        fontWeight: "600"
    }
})