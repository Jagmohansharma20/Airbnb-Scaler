import sqlite3
from database import DB_PATH, init_db
from auth import hash_password

def seed_database():
    init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()

    # Clear existing data
    cursor.execute("DELETE FROM reviews;")
    cursor.execute("DELETE FROM favourites;")
    cursor.execute("DELETE FROM bookings;")
    cursor.execute("DELETE FROM listing_features;")
    cursor.execute("DELETE FROM listing_amenities;")
    cursor.execute("DELETE FROM listing_images;")
    cursor.execute("DELETE FROM listings;")
    cursor.execute("DELETE FROM users;")

    # Reset autoincrement
    cursor.execute("DELETE FROM sqlite_sequence WHERE name IN ('users', 'listings', 'listing_images', 'listing_features', 'bookings', 'favourites', 'reviews');")

    default_pwd_hash = hash_password("password123")

    # 1. Seed Users
    users_data = [
        ("Aarav Sharma", "aarav@airbnb.com", default_pwd_hash, "+91 9876543210", 1),
        ("Priya Patel", "priya@airbnb.com", default_pwd_hash, "+91 9823456789", 1),
        ("Vikram Malhotra", "vikram@airbnb.com", default_pwd_hash, "+91 9712345678", 1),
        ("Sarah Jenkins", "sarah@airbnb.com", default_pwd_hash, "+91 9988776655", 1),
        ("Balaji Dev", "balaji@airbnb.com", default_pwd_hash, "+91 9123456780", 1),
        ("Rahul Guest", "rahul@guest.com", default_pwd_hash, "+91 9111222333", 0),
    ]

    for name, email, pwd_hash, phone, is_host in users_data:
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, phone, is_host) VALUES (?, ?, ?, ?, ?)",
            (name, email, pwd_hash, phone, is_host)
        )

    # 2. Seed Amenities lookup
    amenities_list = ["TV", "Fridge", "AC", "WiFi", "Free Parking", "Washing Machine", "Gym", "Kitchen"]
    amenity_id_map = {}
    for a in amenities_list:
        cursor.execute("INSERT OR IGNORE INTO amenities (name) VALUES (?)", (a,))
        cursor.execute("SELECT id FROM amenities WHERE name = ?", (a,))
        amenity_id_map[a] = cursor.fetchone()["id"]

    # 3. Seed Listings with 3 images each, amenities, uniqueness, property_type, and place_type
    listings_data = [
        {
            "host_id": 1,
            "house_name": "The Heritage Havelock House",
            "street": "14 Shanti Path, Chanakyapuri",
            "location": "Delhi",
            "state": "Delhi",
            "description": "Experience timeless colonial elegance in the heart of South Delhi. Featuring lush manicured lawns, high ceilings, handcrafted teak furniture, and private verandas with serene morning birdsong.",
            "price_per_night": 5200.0,
            "maximum_guests": 6,
            "property_type": "House",
            "place_type": "Entire place",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "AC", "Kitchen", "Free Parking", "TV", "Fridge"],
            "uniqueness": ["Luxury", "Peaceful", "Central Location"]
        },
        {
            "host_id": 1,
            "house_name": "Azure Horizon Oceanfront Villa",
            "street": "Beach Road, Candolim",
            "location": "Goa",
            "state": "Goa",
            "description": "Direct beachfront villa with an infinity plunge pool overlooking the Arabian Sea. Enjoy golden sunsets from your private sundeck, outdoor barbecue pit, and floor-to-ceiling glass doors.",
            "price_per_night": 8500.0,
            "maximum_guests": 8,
            "property_type": "Villa",
            "place_type": "Entire place",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "AC", "Kitchen", "Free Parking", "TV", "Washing Machine"],
            "uniqueness": ["Scenic View", "Luxury", "Peaceful"]
        },
        {
            "host_id": 2,
            "house_name": "Skyline Penthouse with Private Terrace",
            "street": "Bandra West, Carter Road",
            "location": "Mumbai",
            "state": "Maharashtra",
            "description": "Ultra-modern luxury apartment with panoramic sea-facing views. Features a designer open-concept kitchen, smart ambient lighting, dedicated workspace, and high-speed fiber internet.",
            "price_per_night": 7200.0,
            "maximum_guests": 4,
            "property_type": "Apartment",
            "place_type": "Entire place",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "AC", "Kitchen", "Gym", "Washing Machine", "TV"],
            "uniqueness": ["Scenic View", "Central Location", "Luxury"]
        },
        {
            "host_id": 2,
            "house_name": "Cedar Wood Himalayan Cabin",
            "street": "Old Manali Trail",
            "location": "Manali",
            "state": "Himachal Pradesh",
            "description": "A cozy hand-hewn cedar chalet tucked amid pine forests and snow-capped peaks. Cozy up by the stone fireplace, sip hot spiced chai on the balcony, or stargaze from the attic window.",
            "price_per_night": 3800.0,
            "maximum_guests": 4,
            "property_type": "Cabin",
            "place_type": "Private room",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "Kitchen", "Free Parking", "Fridge", "TV"],
            "uniqueness": ["Nature Retreat", "Scenic View", "Cozy"]
        },
        {
            "host_id": 3,
            "house_name": "Royal Rajputana Palace Suite",
            "street": "Near City Palace, C-Scheme",
            "location": "Jaipur",
            "state": "Rajasthan",
            "description": "Immerse yourself in regal Rajasthani hospitality. Ornately carved jharokhas, marble flooring, courtyard dining under starry skies, and curated heritage artwork.",
            "price_per_night": 6400.0,
            "maximum_guests": 5,
            "property_type": "Hotel",
            "place_type": "Hotel room",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "AC", "Free Parking", "Gym", "TV", "Fridge"],
            "uniqueness": ["Luxury", "Family Friendly", "Central Location"]
        },
        {
            "host_id": 3,
            "house_name": "Emerald Backwater Palms Estate",
            "street": "Vembanad Lakefront",
            "location": "Alleppey",
            "state": "Kerala",
            "description": "Tranquil traditional Kerala wooden bungalow on the edge of the backwaters. Includes private canoe rides, coconut grove hammock trails, and organic spice garden.",
            "price_per_night": 4900.0,
            "maximum_guests": 6,
            "property_type": "House",
            "place_type": "Entire place",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "AC", "Kitchen", "Free Parking", "Washing Machine"],
            "uniqueness": ["Nature Retreat", "Peaceful", "Scenic View"]
        },
        {
            "host_id": 4,
            "house_name": "Urban Minimalist Studio Loft",
            "street": "100ft Road, Indiranagar",
            "location": "Bangalore",
            "state": "Karnataka",
            "description": "Sleek industrial-style loft located right next to Bangalore's premier cafes, microbreweries, and boutique shops. High ceilings, ergonomic Herman Miller work chair, and gigabit WiFi.",
            "price_per_night": 3200.0,
            "maximum_guests": 2,
            "property_type": "Apartment",
            "place_type": "Private room",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1502005229762-ee1b2b814660?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "AC", "Kitchen", "Washing Machine", "TV"],
            "uniqueness": ["Central Location", "Cozy"]
        },
        {
            "host_id": 4,
            "house_name": "Lake Pichola Sunset Luxury Resort",
            "street": "Lal Ghat, Lake Road",
            "location": "Udaipur",
            "state": "Rajasthan",
            "description": "Mesmerizing lake-facing luxury resort with an arched rooftop gazebo. Watch shimmering waters, historic fortresses, and evening candlelit aartis from your private terrace.",
            "price_per_night": 5800.0,
            "maximum_guests": 4,
            "property_type": "Resort",
            "place_type": "Hotel room",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "AC", "TV", "Free Parking", "Fridge"],
            "uniqueness": ["Scenic View", "Luxury", "Peaceful"]
        },
        {
            "host_id": 1,
            "house_name": "Misty Green Tea Plantation Cottage",
            "street": "Munnar Valley Heights",
            "location": "Munnar",
            "state": "Kerala",
            "description": "Surround yourself with rolling emerald tea gardens and mist-draped hills. Fresh mountain breeze, guided tea picking tours, open-air campfire area, and homemade south-Indian breakfast.",
            "price_per_night": 3500.0,
            "maximum_guests": 5,
            "property_type": "Cottage",
            "place_type": "Entire place",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "Kitchen", "Free Parking", "Fridge"],
            "uniqueness": ["Nature Retreat", "Peaceful", "Family Friendly"]
        },
        {
            "host_id": 2,
            "house_name": "Ganga Bliss Eco Guesthouse",
            "street": "Tapovan, Badrinath Road",
            "location": "Rishikesh",
            "state": "Uttarakhand",
            "description": "Peaceful riverbank guesthouse nestled right next to yoga ashrams and sacred ghats. Rooftop meditation hall, fresh vegan meals, and vibrant traveler community.",
            "price_per_night": 2200.0,
            "maximum_guests": 4,
            "property_type": "Guesthouse",
            "place_type": "Shared room",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "Kitchen", "Free Parking", "AC"],
            "uniqueness": ["Nature Retreat", "Peaceful", "Central Location"]
        },
        {
            "host_id": 2,
            "house_name": "Contemporary Designer Studio in South Delhi",
            "street": "Hauz Khas Village",
            "location": "Delhi",
            "state": "Delhi",
            "description": "Vibrant and stylish studio apartment overlooking the historic Hauz Khas lake and medieval monuments. Walking distance to art galleries, chic bistros, and Deer Park.",
            "price_per_night": 4100.0,
            "maximum_guests": 3,
            "property_type": "Apartment",
            "place_type": "Private room",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "AC", "Kitchen", "TV", "Washing Machine"],
            "uniqueness": ["Central Location", "Scenic View", "Cozy"]
        },
        {
            "host_id": 1,
            "house_name": "Goa Beachfront Sunset Villa",
            "street": "Vagator Cliff View Road",
            "location": "Goa",
            "state": "Goa",
            "description": "Spectacular cliffside villa overlooking Vagator beach with private infinity plunge pool and sunset terrace.",
            "price_per_night": 7000.0,
            "maximum_guests": 6,
            "property_type": "Villa",
            "place_type": "Entire place",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "AC", "Kitchen", "Free Parking", "TV"],
            "uniqueness": ["Scenic View", "Luxury", "Peaceful"]
        },
        {
            "host_id": 3,
            "house_name": "Ooty Heritage Pine Forest Bungalow",
            "street": "Dodabetta Peak Road",
            "location": "Ooty",
            "state": "Tamil Nadu",
            "description": "Nestled amid towering blue gum trees and eucalyptus groves. Colonial wooden fireplace, expansive flower garden, and fresh mountain vistas.",
            "price_per_night": 4600.0,
            "maximum_guests": 6,
            "property_type": "Cottage",
            "place_type": "Entire place",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "Kitchen", "Free Parking", "Fridge", "TV"],
            "uniqueness": ["Nature Retreat", "Scenic View", "Peaceful"]
        },
        {
            "host_id": 4,
            "house_name": "French Quarter Heritage Villa",
            "street": "Rue Romain Rolland, White Town",
            "location": "Pondicherry",
            "state": "Puducherry",
            "description": "Charming Franco-Tamil heritage home with a tranquil inner courtyard, high yellow walls, terracotta tiles, and bougainvillea archways.",
            "price_per_night": 5100.0,
            "maximum_guests": 5,
            "property_type": "Villa",
            "place_type": "Entire place",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "AC", "Kitchen", "Free Parking", "TV"],
            "uniqueness": ["Central Location", "Peaceful", "Luxury"]
        },
        {
            "host_id": 1,
            "house_name": "Shimla Snow Peak Swiss Chalet",
            "street": "Jakhoo Hill Crest",
            "location": "Shimla",
            "state": "Himachal Pradesh",
            "description": "Authentic pine-and-stone alpine chalet offering breathtaking views of the Shivalik range. Features warm wooden interiors and a private observation deck.",
            "price_per_night": 4200.0,
            "maximum_guests": 4,
            "property_type": "Cabin",
            "place_type": "Entire place",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "Kitchen", "Free Parking", "TV"],
            "uniqueness": ["Scenic View", "Cozy", "Nature Retreat"]
        },
        {
            "host_id": 2,
            "house_name": "Kochi Fort Colonial Garden Manor",
            "street": "Princess Street, Fort Kochi",
            "location": "Kochi",
            "state": "Kerala",
            "description": "Step into history with this Portuguese-influenced manor steps from the Chinese fishing nets, spice markets, and art cafes.",
            "price_per_night": 3900.0,
            "maximum_guests": 4,
            "property_type": "House",
            "place_type": "Entire place",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "AC", "Kitchen", "TV", "Free Parking"],
            "uniqueness": ["Central Location", "Peaceful"]
        },
        {
            "host_id": 3,
            "house_name": "Goa Tropical Palms Eco Resort",
            "street": "Anjuna Flea Market Road",
            "location": "Goa",
            "state": "Goa",
            "description": "Boho-chic luxury cottage retreat with private garden jacuzzi, outdoor open-air shower, and breezy palm thatch balconies.",
            "price_per_night": 5400.0,
            "maximum_guests": 4,
            "property_type": "Resort",
            "place_type": "Hotel room",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "AC", "Free Parking", "Gym", "Fridge"],
            "uniqueness": ["Luxury", "Peaceful", "Scenic View"]
        },
        {
            "host_id": 4,
            "house_name": "Koramangala Modern Tech Residency",
            "street": "80ft Road, 4th Block",
            "location": "Bangalore",
            "state": "Karnataka",
            "description": "Executive smart home designed for business travelers and digital nomads. Dual monitors, standing desk, soundproofing, and fitness hub.",
            "price_per_night": 3400.0,
            "maximum_guests": 3,
            "property_type": "Apartment",
            "place_type": "Entire place",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "AC", "Kitchen", "Gym", "Washing Machine", "TV"],
            "uniqueness": ["Central Location", "Cozy"]
        },
        {
            "host_id": 1,
            "house_name": "Jaipur Peacock Courtyard Haveli",
            "street": "Amer Fort Road",
            "location": "Jaipur",
            "state": "Rajasthan",
            "description": "Restored 19th-century haveli with frescoed walls, traditional jali windows, and a fountain courtyard where peacocks visit each dawn.",
            "price_per_night": 5900.0,
            "maximum_guests": 6,
            "property_type": "House",
            "place_type": "Entire place",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "AC", "Kitchen", "Free Parking", "TV"],
            "uniqueness": ["Luxury", "Family Friendly", "Scenic View"]
        },
        {
            "host_id": 2,
            "house_name": "Juhu Beach Sunrise Penthouse",
            "street": "Juhu Tara Road",
            "location": "Mumbai",
            "state": "Maharashtra",
            "description": "Exclusive beachfront penthouse with uninterrupted sea views, private rooftop bar, and direct access to Mumbai's lively coast.",
            "price_per_night": 8800.0,
            "maximum_guests": 6,
            "property_type": "Apartment",
            "place_type": "Entire place",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "AC", "Kitchen", "Gym", "Washing Machine", "TV"],
            "uniqueness": ["Scenic View", "Luxury", "Central Location"]
        },
        {
            "host_id": 3,
            "house_name": "Kasol Riverside Alpine Cabin",
            "street": "Parvati Valley Path",
            "location": "Kasol",
            "state": "Himachal Pradesh",
            "description": "Handcrafted log cabin perched directly over the gushing Parvati river with a glass floor sunroom and cedar sauna.",
            "price_per_night": 3100.0,
            "maximum_guests": 4,
            "property_type": "Cabin",
            "place_type": "Private room",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "Kitchen", "Free Parking", "Fridge"],
            "uniqueness": ["Nature Retreat", "Scenic View", "Cozy"]
        },
        {
            "host_id": 4,
            "house_name": "Udaipur Aravali Hills Boutique Hotel",
            "street": "Tiger Hill Pass",
            "location": "Udaipur",
            "state": "Rajasthan",
            "description": "Boutique hillside hotel with an infinity pool facing the Aravali mountain sunsets and private rooftop dining gazebos.",
            "price_per_night": 6200.0,
            "maximum_guests": 4,
            "property_type": "Hotel",
            "place_type": "Hotel room",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "AC", "Free Parking", "Gym", "TV", "Fridge"],
            "uniqueness": ["Scenic View", "Luxury", "Peaceful"]
        },
        {
            "host_id": 1,
            "house_name": "Vagator Bohemian Garden Cottage",
            "street": "Ozran Beach Lane",
            "location": "Goa",
            "state": "Goa",
            "description": "Enchanting garden cottage surrounded by coconut trees, natural swimming pond, and outdoor hammocks just 5 minutes from Little Vagator.",
            "price_per_night": 4500.0,
            "maximum_guests": 4,
            "property_type": "Cottage",
            "place_type": "Entire place",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "AC", "Kitchen", "Free Parking", "Fridge"],
            "uniqueness": ["Nature Retreat", "Peaceful", "Cozy"]
        },
        {
            "host_id": 2,
            "house_name": "Cyber City Luxury Suite",
            "street": "DLF Phase 2, Golf Course Road",
            "location": "Delhi",
            "state": "Delhi",
            "description": "Ultra-sleek corporate apartment in NCR with floor-to-ceiling windows, smart home automation, and luxury clubhouse access.",
            "price_per_night": 4800.0,
            "maximum_guests": 3,
            "property_type": "Apartment",
            "place_type": "Entire place",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "AC", "Kitchen", "Gym", "Washing Machine", "TV"],
            "uniqueness": ["Central Location", "Luxury"]
        },
        {
            "host_id": 3,
            "house_name": "Rishikesh Himalayan Serenity Resort",
            "street": "Neelkanth Temple Road",
            "location": "Rishikesh",
            "state": "Uttarakhand",
            "description": "Luxurious hill resort overlooking the emerald waters of the Ganges. Includes private yoga pavilion, Ayurvedic spa treatments, and organic cafe.",
            "price_per_night": 6500.0,
            "maximum_guests": 5,
            "property_type": "Resort",
            "place_type": "Hotel room",
            "bathroom_type": "Attached",
            "images": [
                "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "AC", "Free Parking", "Gym", "Fridge"],
            "uniqueness": ["Scenic View", "Peaceful", "Luxury"]
        }
    ]

    for item in listings_data:
        bedrooms = item.get("bedrooms", max(1, item["maximum_guests"] // 2))
        beds = item.get("beds", max(1, item["maximum_guests"] - 1))
        cursor.execute("""
            INSERT INTO listings (
                host_id, house_name, street, location, state, description,
                price_per_night, maximum_guests, bedrooms, beds, property_type, place_type, bathroom_type, is_active
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (
            item["host_id"], item["house_name"], item["street"], item["location"],
            item["state"], item["description"], item["price_per_night"],
            item["maximum_guests"], bedrooms, beds, item["property_type"], item["place_type"], item["bathroom_type"]
        ))
        listing_id = cursor.lastrowid

        # Insert 3 images with order 1, 2, 3
        for idx, img_url in enumerate(item["images"], start=1):
            cursor.execute(
                "INSERT INTO listing_images (listing_id, image_url, image_order) VALUES (?, ?, ?)",
                (listing_id, img_url, idx)
            )

        # Insert amenities
        for amenity_name in item["amenities"]:
            if amenity_name in amenity_id_map:
                cursor.execute(
                    "INSERT INTO listing_amenities (listing_id, amenity_id) VALUES (?, ?)",
                    (listing_id, amenity_id_map[amenity_name])
                )

        # Insert features/uniqueness
        for feature in item["uniqueness"]:
            cursor.execute(
                "INSERT INTO listing_features (listing_id, feature_name) VALUES (?, ?)",
                (listing_id, feature)
            )

    # 4. Seed sample reviews
    reviews_data = [
        (1, 4, 5.0, "Absolute paradise in South Delhi! The host Aarav was immensely hospitable, and the gardens were breathtaking."),
        (1, 3, 4.8, "Gorgeous colonial vibe, spotlessly clean rooms, and perfect location. Will definitely book again!"),
        (2, 4, 4.9, "The sunset view from the pool deck is unforgettable. Super private and close to the beach."),
        (3, 1, 5.0, "Top-tier penthouse in Bandra. High-speed internet worked great for my work calls."),
        (4, 5, 4.7, "The fireplace and wooden scent were magical. Authentic Manali retreat."),
        (5, 2, 4.9, "Felt like royalty. The courtyard meals and palace rooms were unbelievable."),
        (6, 4, 4.8, "The serene backwaters canoe ride arranged by Vikram made our trip."),
        (7, 3, 4.6, "Convenient Indiranagar location, very comfortable bed and modern aesthetic."),
        (8, 5, 5.0, "Spectacular sunset view of Lake Pichola. A dream stay in Udaipur."),
        (9, 2, 4.8, "Crisp morning air and fresh tea plantation walks. Wonderfully peaceful!"),
        (10, 4, 4.7, "Loved being steps away from the Hauz Khas monuments and rooftop cafes.")
    ]

    for listing_id, user_id, rating, comment in reviews_data:
        cursor.execute("""
            INSERT INTO reviews (listing_id, user_id, rating, comment)
            VALUES (?, ?, ?, ?)
        """, (listing_id, user_id, rating, comment))

    # 5. Seed sample bookings (e.g. for listing 1: The Heritage Havelock Villa, Delhi)
    # Booked for 2026-08-20 to 2026-08-24 to demonstrate Section 8 & 48 date-overlap search
    cursor.execute("""
        INSERT INTO bookings (listing_id, user_id, start_date, end_date, guests, total_price, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (1, 4, "2026-08-20", "2026-08-24", 2, 22300.0, "confirmed"))

    # Seed sample favorites for user 5 (Balaji Dev)
    cursor.execute("INSERT INTO favourites (user_id, listing_id) VALUES (?, ?)", (5, 1))
    cursor.execute("INSERT INTO favourites (user_id, listing_id) VALUES (?, ?)", (5, 2))

    conn.commit()
    conn.close()
    print("Database successfully seeded with 10 houses, 5 users, amenities, reviews, bookings, and favourites.")

if __name__ == "__main__":
    seed_database()
