
# MealScan - AI Calorie & Macro Tracker

## Overview
A mobile-friendly web app where users photograph their meals to get instant calorie and macro estimates, track daily nutrition goals, and view trends over time.

## Pages & Features

### 1. Auth Pages (Login / Sign Up)
- Email-based authentication with Lovable Cloud
- Clean, minimal login and signup forms

### 2. Dashboard (Home)
- **Daily summary ring/progress bar** showing calories consumed vs. daily goal
- **Macros breakdown** (protein, carbs, fat) with progress bars
- **Today's meals list** with thumbnails and calorie totals
- **Quick "Scan Meal" button** (prominent, floating action style)

### 3. Scan / Add Meal
- **Camera capture or photo upload** of the meal
- AI analyzes the image using Lovable AI (Gemini vision model) and returns:
  - Identified food items
  - Estimated calories, protein, carbs, fat per item
- User can **review, edit, and confirm** the AI estimates before saving
- **Manual entry fallback** — search/type food items and portions

### 4. Meal History
- Scrollable log of past meals grouped by date
- Each entry shows photo thumbnail, food items, and calorie/macro totals
- Tap to view full details or edit

### 5. Analytics / Trends
- **Weekly and monthly charts** (using Recharts) showing:
  - Calorie intake over time
  - Macro distribution trends
- Average daily intake stats

### 6. Settings / Profile
- Set daily calorie and macro goals
- Edit profile info
- Logout

## Backend (Lovable Cloud)
- **Database tables**: profiles, meals, meal_items
- **Edge function**: Sends meal photo to Lovable AI (Gemini vision) for food identification and calorie estimation
- **Storage bucket**: For meal photos
- **Auth**: Email sign-up/login via Supabase Auth

## Design
- Mobile-first, clean and modern UI
- Soft greens and whites for a health/wellness feel
- Card-based layout for meals
