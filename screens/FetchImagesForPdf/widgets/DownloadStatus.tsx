import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type DownloadStatusProps = {
    data: any; // the fetched data
    item: { editionName: string };
    currentPage: number;
    totalPages: number;
    onViewPdf?: () => void; // optional callback when "View PDF" pressed
};

export default function DownloadStatus({
    data,
    item,
    currentPage,
    totalPages,
    onViewPdf,
}: DownloadStatusProps) {

    const handleViewPdf = () => {
        if (onViewPdf) {
            onViewPdf();
        }
    };

    return (
        <View style={styles.container}>
            {!data ? (
                <View style={styles.overlay}>
                    <Text style={styles.overlayText}>Fetching Information…</Text>
                </View>
            ) : (
                <View style={styles.subControls}>
                    <Text style={styles.titleText}>
                        Times of India {item.editionName}
                    </Text>
                    <Text style={styles.progressText}>
                        Downloading Pages {currentPage}/{totalPages}
                    </Text>

                    {currentPage === totalPages && (
                        <TouchableOpacity
                            style={styles.viewPdfButton}
                            onPress={handleViewPdf}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.viewPdfButtonText}>View PDF</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    subControls: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
        backgroundColor: "#f5f5f5",
    },
    container: {
        flex: 1,
    },
    titleText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#222",
        marginBottom: 10,
    },
    progressText: {
        fontSize: 16,
        color: "#555",
        marginBottom: 20,
    },
    viewPdfButton: {
        backgroundColor: "#1E90FF",
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    viewPdfButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },

    // Overlay styles
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)", // semi-transparent dark overlay
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    overlayText: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#FFD700", // bright gold/yellow text
    },
});