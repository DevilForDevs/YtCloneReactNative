import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
export const TOI_CITY_MAP: Record<string, string> = {
    cap: "Delhi",
    toigo: "Goa",
    toiac: "Ahmedabad",
    toibgc: "Bengaluru",
    toibhoc: "Bhubaneswar",
    toicgct: "Chandigarh",
    toich: "Chennai",
    toih: "Hyderabad",
    toijc: "Jaipur",
    toikrko: "Kolkata",
    toikc: "Kochi",
    toilc: "Lucknow",
    toim: "Mumbai",
    toipuc: "Pune"
};

export const ET_CITY_MAP: Record<string, string> = {
    etdc: "Delhi",
    etbg: "Bangalore",
    etmc: "Mumbai",
    etkc: "Kolkata"
};

// export const ToiMirror_CITY_MAP: Record<string, string> = {
//     vkbgmr: "Bangalore",
//     vkmmir: "Mumbai",
//     pcmir: "Pune",
// };

export const editionMap: Record<string, string> = {

    // National (Top Priority)
    "262-National": "National",

    // ===== BIHAR (Primary Focus State) =====

    // Capital
    "84-Patna-Nagar": "Patna Nagar",

    // Major Bihar Cities
    "203-Muzaffarpur-Nagar": "Muzaffarpur Nagar",
    "205-Bhagalpur-City": "Bhagalpur City",
    "92-Gaya": "Gaya",
    "219-Darbhanga": "Darbhanga",
    "93-Ara": "Ara",
    "223-Purnea": "Purnea",

    // Other Important Districts
    "215-Motihari": "Motihari",
    "230-Katihar": "Katihar",
    "231-Khagaria": "Khagaria",
    "274-Gopalganj": "Gopalganj",
    "217-Samstipur": "Samstipur",
    "206-Saharsa": "Saharsa",
    "218-Sitamarhi": "Sitamarhi",
    "94-Vaishali": "Vaishali",
    "91-Begusarai": "Begusarai",
    "85-Biharsarif": "Biharsarif",
    "89-Sasaram": "Sasaram",
    "90-Saran": "Saran",
    "87-Siwan": "Siwan",
    "216-Madhubani": "Madhubani",
    "228-Lakhisarai": "Lakhisarai",
    "232-Banka": "Banka",
    "214-Betiah": "Betiah",
    "224-Kisanganj": "Kisanganj",
    "289-Supaul": "Supaul",
    "297-Madhepura": "Madhepura",
    "292-Bhabhua": "Bhabhua",
    "225-Arraria": "Arraria",
    "88-Jehanabad": "Jehanabad",
    "229-Munger": "Munger",
    "282-NAWADA": "NAWADA",
    "86-Buxer": "Buxer",

    // ===== DELHI =====

    // Main Capital Edition
    "4-Delhi-City": "Delhi City",

    // Delhi Zones
    "298-South-Delhi": "South Delhi",
    "238-East-Delhi": "East Delhi",
    "239-West-Delhi": "West Delhi",
    "240-Outer-Delhi": "Outer Delhi",

    // NCR
    "241-Noida": "Noida"
};

const cityUrlMap = {
    // ===== TIER 1 — MAJOR EDITIONS =====
    "patna-city": "Patna",
    "ranchi-city": "Ranchi",
    "muzaffarpur-city": "Muzaffarpur",
    "bhagalpur-city": "Bhagalpur",
    "gaya-city": "Gaya",
    "jamshedpur-city": "Jamshedpur",
    "dhanbad-city": "Dhanbad",
    "kolkata-city": "Kolkata",
    "deoghar-city": "Deoghar",

    // ===== TIER 2 — LARGE REGIONAL HUBS =====
    "darbhanga": "Darbhanga",
    "begusarai": "Begusarai",
    "purnia": "Purnia",
    "munger": "Munger",
    "katihar": "Katihar",
    "sahrsa": "Saharsa",
    "samstipur": "Samastipur",
    "motihari": "Motihari",
    "arah": "Arah",
    "biharsharif": "Biharsharif",
    "bokaro": "Bokaro",
    "giridih": "Giridih",
    "hazaribagh": "Hazaribagh",
    "rourkela": "Rourkela",

    // ===== TIER 3 — MEDIUM DISTRICTS =====
    "buxar": "Buxar",
    "gopalganj": "Gopalganj",
    "hajipur": "Hajipur",
    "jehanabad": "Jehanabad",
    "saran": "Saran",
    "siwan": "Siwan",
    "betiah": "Betiah",
    "madhubani": "Madhubani",
    "sitamarahi": "Sitamarahi",
    "kishanganj": "Kishanganj",
    "araria": "Araria",
    "banka": "Banka",
    "khagaria": "Khagaria",
    "lakhisarai": "Lakhisarai",
    "jamui": "Jamui",
    "madhepura": "Madhepura",
    "supaul": "Supaul",
    "kaimur": "Kaimur",
    "sasaram": "Sasaram",
    "aurangabad": "Aurangabad",
    "nawada": "Nawada",

    // ===== TIER 4 — SMALLER / SUB-EDITIONS =====
    "chaibasa": "Chaibasa",
    "ghatsila": "Ghatsila",
    "gumla": "Gumla",
    "koderma": "Koderma",
    "khalari": "Khalari",
    "khunti": "Khunti",
    "lohardaga": "Lohardaga",
    "palamu": "Palamu",
    "ramgarh": "Ramgarh",
    "silli": "Silli",
    "chatra": "Chatra",
    "garhwa": "Garhwa",
    "simdega": "Simdega",
    "latehar": "Latehar",
    "jamtara": "Jamtara",
    "dumka": "Dumka",
    "godda": "Godda",
    "sahibganj": "Sahibganj",
    "pakur": "Pakur",
    "silpanchal": "Silpanchal"
};


export async function getNewsPapers(database: SQLiteDatabase): Promise<Section[]> {

    const scrappedSections: Section[] = []

    const rows = await getAllFeatureCodes(database)

    const activeFeatures = rows.map((item) => item.coupanItemId)

    // Feature 1 → Times of India
    if (activeFeatures.includes(1)) {
        scrappedSections.push({
            title: "Times of India",
            items: Object.entries(TOI_CITY_MAP).map(([code, city]) => ({
                label: city,
                value: code,
                link: "https://epaper.indiatimes.com/"
            }))
        })
    }

    // Feature 2 → Economic Times
    if (activeFeatures.includes(2)) {
        scrappedSections.push({
            title: "The Economic Times",
            items: Object.entries(ET_CITY_MAP).map(([code, city]) => ({
                label: city,
                value: code,
                link: "https://economictimes.indiatimes.com/"
            }))
        })
    }

    // Feature 3 → Jagran
    if (activeFeatures.includes(3)) {
        scrappedSections.push({
            title: "Dainik Jagran",
            items: Object.entries(editionMap).map(([key, name]) => ({
                label: name,
                value: key,
                link: "https://epaper.jagran.com/"
            }))
        })
    }

    // Feature 4 → Prabhat Khabar
    if (activeFeatures.includes(4)) {
        scrappedSections.push({
            title: "प्रभात खबर",
            items: Object.entries(cityUrlMap).map(([key, name]) => ({
                label: name,
                value: key,
                link: "https://epaper.prabhatkhabar.com/"
            }))
        })
    }

    return scrappedSections
}

async function getAllFeatureCodes(database: SQLiteDatabase): Promise<any[]> {
    const [result] = await database.executeSql(
        "SELECT * FROM feature_codes"
    );

    const items: any[] = [];

    for (let i = 0; i < result.rows.length; i++) {
        items.push(result.rows.item(i));
    }

    return items;
}