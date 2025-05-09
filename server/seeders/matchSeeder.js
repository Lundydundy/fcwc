const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Match = require('../models/Match');
const connectDB = require('../config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Tournament fixtures data
const fixturesData = [
  // Saturday 14 June 2025
  {
    homeTeam: 'Al Ahly FC',
    awayTeam: 'Inter Miami CF',
    date: new Date('2025-06-14'),
    time: '20:00',
    stage: 'First stage',
    group: 'Group A',
    homeScore: null,
    awayScore: null,
    played: false
  },
  
  // Sunday 15 June 2025
  {
    homeTeam: 'FC Bayern München',
    awayTeam: 'Auckland City FC',
    date: new Date('2025-06-15'),
    time: '12:00',
    stage: 'First stage',
    group: 'Group C',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'Paris Saint-Germain',
    awayTeam: 'Atlético de Madrid',
    date: new Date('2025-06-15'),
    time: '15:00',
    stage: 'First stage',
    group: 'Group B',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'SE Palmeiras',
    awayTeam: 'FC Porto',
    date: new Date('2025-06-15'),
    time: '18:00',
    stage: 'First stage',
    group: 'Group A',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'Botafogo',
    awayTeam: 'Seattle Sounders FC',
    date: new Date('2025-06-15'),
    time: '22:00',
    stage: 'First stage',
    group: 'Group B',
    homeScore: null,
    awayScore: null,
    played: false
  },
  
  // Monday 16 June 2025
  {
    homeTeam: 'Chelsea FC',
    awayTeam: 'D4',
    date: new Date('2025-06-16'),
    time: '15:00',
    stage: 'First stage',
    group: 'Group D',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'CA Boca Juniors',
    awayTeam: 'SL Benfica',
    date: new Date('2025-06-16'),
    time: '18:00',
    stage: 'First stage',
    group: 'Group C',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'CR Flamengo',
    awayTeam: 'Espérance Sportive De Tunisie',
    date: new Date('2025-06-16'),
    time: '21:00',
    stage: 'First stage',
    group: 'Group D',
    homeScore: null,
    awayScore: null,
    played: false
  },
  
  // Tuesday 17 June 2025
  {
    homeTeam: 'Fluminense FC',
    awayTeam: 'Borussia Dortmund',
    date: new Date('2025-06-17'),
    time: '12:00',
    stage: 'First stage',
    group: 'Group F',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'CA River Plate',
    awayTeam: 'Urawa Red Diamonds',
    date: new Date('2025-06-17'),
    time: '15:00',
    stage: 'First stage',
    group: 'Group E',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'Ulsan HD',
    awayTeam: 'Mamelodi Sundowns FC',
    date: new Date('2025-06-17'),
    time: '18:00',
    stage: 'First stage',
    group: 'Group F',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'CF Monterrey',
    awayTeam: 'FC Internazionale Milano',
    date: new Date('2025-06-17'),
    time: '21:00',
    stage: 'First stage',
    group: 'Group E',
    homeScore: null,
    awayScore: null,
    played: false
  },
  
  // Wednesday 18 June 2025
  {
    homeTeam: 'Manchester City',
    awayTeam: 'Wydad AC',
    date: new Date('2025-06-18'),
    time: '12:00',
    stage: 'First stage',
    group: 'Group G',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'Real Madrid C.F.',
    awayTeam: 'Al Hilal FC',
    date: new Date('2025-06-18'),
    time: '15:00',
    stage: 'First stage',
    group: 'Group H',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'CF Pachuca',
    awayTeam: 'FC Salzburg',
    date: new Date('2025-06-18'),
    time: '18:00',
    stage: 'First stage',
    group: 'Group H',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'Al Ain FC',
    awayTeam: 'Juventus FC',
    date: new Date('2025-06-18'),
    time: '21:00',
    stage: 'First stage',
    group: 'Group G',
    homeScore: null,
    awayScore: null,
    played: false
  },
  
  // Thursday 19 June 2025
  {
    homeTeam: 'SE Palmeiras',
    awayTeam: 'Al Ahly FC',
    date: new Date('2025-06-19'),
    time: '12:00',
    stage: 'First stage',
    group: 'Group A',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'Inter Miami CF',
    awayTeam: 'FC Porto',
    date: new Date('2025-06-19'),
    time: '15:00',
    stage: 'First stage',
    group: 'Group A',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'Seattle Sounders FC',
    awayTeam: 'Atlético de Madrid',
    date: new Date('2025-06-19'),
    time: '18:00',
    stage: 'First stage',
    group: 'Group B',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'Paris Saint-Germain',
    awayTeam: 'Botafogo',
    date: new Date('2025-06-19'),
    time: '21:00',
    stage: 'First stage',
    group: 'Group B',
    homeScore: null,
    awayScore: null,
    played: false
  },
  
  // Friday 20 June 2025
  {
    homeTeam: 'SL Benfica',
    awayTeam: 'Auckland City FC',
    date: new Date('2025-06-20'),
    time: '12:00',
    stage: 'First stage',
    group: 'Group C',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'CR Flamengo',
    awayTeam: 'Chelsea FC',
    date: new Date('2025-06-20'),
    time: '14:00',
    stage: 'First stage',
    group: 'Group D',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'D4',
    awayTeam: 'Espérance Sportive De Tunisie',
    date: new Date('2025-06-20'),
    time: '18:00',
    stage: 'First stage',
    group: 'Group D',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'FC Bayern München',
    awayTeam: 'CA Boca Juniors',
    date: new Date('2025-06-20'),
    time: '21:00',
    stage: 'First stage',
    group: 'Group C',
    homeScore: null,
    awayScore: null,
    played: false
  },
  
  // Saturday 21 June 2025
  {
    homeTeam: 'Mamelodi Sundowns FC',
    awayTeam: 'Borussia Dortmund',
    date: new Date('2025-06-21'),
    time: '12:00',
    stage: 'First stage',
    group: 'Group F',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'FC Internazionale Milano',
    awayTeam: 'Urawa Red Diamonds',
    date: new Date('2025-06-21'),
    time: '15:00',
    stage: 'First stage',
    group: 'Group E',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'Fluminense FC',
    awayTeam: 'Ulsan HD',
    date: new Date('2025-06-21'),
    time: '18:00',
    stage: 'First stage',
    group: 'Group F',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'CA River Plate',
    awayTeam: 'CF Monterrey',
    date: new Date('2025-06-21'),
    time: '21:00',
    stage: 'First stage',
    group: 'Group E',
    homeScore: null,
    awayScore: null,
    played: false
  },
  
  // Sunday 22 June 2025
  {
    homeTeam: 'Juventus FC',
    awayTeam: 'Wydad AC',
    date: new Date('2025-06-22'),
    time: '12:00',
    stage: 'First stage',
    group: 'Group G',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'Real Madrid C.F.',
    awayTeam: 'CF Pachuca',
    date: new Date('2025-06-22'),
    time: '15:00',
    stage: 'First stage',
    group: 'Group H',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'FC Salzburg',
    awayTeam: 'Al Hilal FC',
    date: new Date('2025-06-22'),
    time: '18:00',
    stage: 'First stage',
    group: 'Group H',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'Manchester City',
    awayTeam: 'Al Ain FC',
    date: new Date('2025-06-22'),
    time: '21:00',
    stage: 'First stage',
    group: 'Group G',
    homeScore: null,
    awayScore: null,
    played: false
  },
  
  // Monday 23 June 2025
  {
    homeTeam: 'Seattle Sounders FC',
    awayTeam: 'Paris Saint-Germain',
    date: new Date('2025-06-23'),
    time: '15:00',
    stage: 'First stage',
    group: 'Group B',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'Atlético de Madrid',
    awayTeam: 'Botafogo',
    date: new Date('2025-06-23'),
    time: '15:00',
    stage: 'First stage',
    group: 'Group B',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'Inter Miami CF',
    awayTeam: 'SE Palmeiras',
    date: new Date('2025-06-23'),
    time: '21:00',
    stage: 'First stage',
    group: 'Group A',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'FC Porto',
    awayTeam: 'Al Ahly FC',
    date: new Date('2025-06-23'),
    time: '21:00',
    stage: 'First stage',
    group: 'Group A',
    homeScore: null,
    awayScore: null,
    played: false
  },
  
  // Tuesday 24 June 2025
  {
    homeTeam: 'Auckland City FC',
    awayTeam: 'CA Boca Juniors',
    date: new Date('2025-06-24'),
    time: '15:00',
    stage: 'First stage',
    group: 'Group C',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'SL Benfica',
    awayTeam: 'FC Bayern München',
    date: new Date('2025-06-24'),
    time: '15:00',
    stage: 'First stage',
    group: 'Group C',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'D4',
    awayTeam: 'CR Flamengo',
    date: new Date('2025-06-24'),
    time: '21:00',
    stage: 'First stage',
    group: 'Group D',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'Espérance Sportive De Tunisie',
    awayTeam: 'Chelsea FC',
    date: new Date('2025-06-24'),
    time: '21:00',
    stage: 'First stage',
    group: 'Group D',
    homeScore: null,
    awayScore: null,
    played: false
  },
  
  // Wednesday 25 June 2025
  {
    homeTeam: 'Borussia Dortmund',
    awayTeam: 'Ulsan HD',
    date: new Date('2025-06-25'),
    time: '15:00',
    stage: 'First stage',
    group: 'Group F',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'Mamelodi Sundowns FC',
    awayTeam: 'Fluminense FC',
    date: new Date('2025-06-25'),
    time: '15:00',
    stage: 'First stage',
    group: 'Group F',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'FC Internazionale Milano',
    awayTeam: 'CA River Plate',
    date: new Date('2025-06-25'),
    time: '21:00',
    stage: 'First stage',
    group: 'Group E',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'Urawa Red Diamonds',
    awayTeam: 'CF Monterrey',
    date: new Date('2025-06-25'),
    time: '21:00',
    stage: 'First stage',
    group: 'Group E',
    homeScore: null,
    awayScore: null,
    played: false
  },
  
  // Thursday 26 June 2025
  {
    homeTeam: 'Juventus FC',
    awayTeam: 'Manchester City',
    date: new Date('2025-06-26'),
    time: '15:00',
    stage: 'First stage',
    group: 'Group G',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'Wydad AC',
    awayTeam: 'Al Ain FC',
    date: new Date('2025-06-26'),
    time: '15:00',
    stage: 'First stage',
    group: 'Group G',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'Al Hilal FC',
    awayTeam: 'CF Pachuca',
    date: new Date('2025-06-26'),
    time: '21:00',
    stage: 'First stage',
    group: 'Group H',
    homeScore: null,
    awayScore: null,
    played: false
  },
  {
    homeTeam: 'FC Salzburg',
    awayTeam: 'Real Madrid C.F.',
    date: new Date('2025-06-26'),
    time: '21:00',
    stage: 'First stage',
    group: 'Group H',
    homeScore: null,
    awayScore: null,
    played: false
  }
];

// Function to import data
const importData = async () => {
  try {
    // Clear existing data
    await Match.deleteMany();
    
    // Import new data
    await Match.create(fixturesData);
    
    console.log('Match data imported successfully');
    process.exit();
  } catch (err) {
    console.error(`Error importing match data: ${err}`);
    process.exit(1);
  }
};

// Run the import
importData();