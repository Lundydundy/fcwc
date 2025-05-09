const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Player = require('./models/Player');
const Team = require('./models/Team');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// FIFA Club World Cup 2025 Teams (based on Wikipedia data)
const teams = [
  // UEFA (12 teams)
  {
    name: "Real Madrid",
    country: "Spain",
    confederation: "UEFA",
    qualified: "UEFA Champions League Winner 2022",
    group: "A",
    logo: "real-madrid.png",
  },
  {
    name: "Manchester City",
    country: "England",
    confederation: "UEFA",
    qualified: "UEFA Champions League Winner 2023",
    group: "B",
    logo: "man-city.png",
  },
  {
    name: "Chelsea",
    country: "England",
    confederation: "UEFA",
    qualified: "UEFA Champions League Winner 2021",
    group: "C",
    logo: "chelsea.png",
  },
  {
    name: "Bayern Munich",
    country: "Germany",
    confederation: "UEFA",
    qualified: "UEFA Club Ranking",
    group: "D",
    logo: "bayern.png",
  },
  {
    name: "Paris Saint-Germain",
    country: "France",
    confederation: "UEFA",
    qualified: "UEFA Club Ranking",
    group: "E",
    logo: "psg.png",
  },
  {
    name: "Inter Milan",
    country: "Italy",
    confederation: "UEFA",
    qualified: "UEFA Club Ranking",
    group: "G",
    logo: "inter.png",
  },
  {
    name: "Borussia Dortmund",
    country: "Germany",
    confederation: "UEFA",
    qualified: "UEFA Club Ranking",
    group: "H",
    logo: "dortmund.png",
  },
  {
    name: "Juventus",
    country: "Italy",
    confederation: "UEFA",
    qualified: "UEFA Club Ranking",
    group: "A",
    logo: "juventus.png",
  },
  {
    name: "Porto",
    country: "Portugal",
    confederation: "UEFA",
    qualified: "UEFA Club Ranking",
    group: "B",
    logo: "porto.png",
  },
  {
    name: "Benfica",
    country: "Portugal",
    confederation: "UEFA",
    qualified: "UEFA Club Ranking",
    group: "C",
    logo: "benfica.png",
  },
  {
    name: "Atlético Madrid",
    country: "Spain",
    confederation: "UEFA",
    qualified: "UEFA Club Ranking",
    group: "D",
    logo: "atletico.png",
  },
  {
    name: "Salzburg",
    country: "Austria", 
    confederation: "UEFA",
    qualified: "UEFA Club Ranking",
    group: "F",
    logo: "salzburg.png",
  },
  
  // CONMEBOL (6 teams)
  {
    name: "Palmeiras",
    country: "Brazil",
    confederation: "CONMEBOL",
    qualified: "Copa Libertadores Winner 2021",
    group: "E",
    logo: "palmeiras.png",
  },
  {
    name: "Flamengo",
    country: "Brazil",
    confederation: "CONMEBOL",
    qualified: "Copa Libertadores Winner 2022",
    group: "F",
    logo: "flamengo.png",
  },
  {
    name: "Fluminense",
    country: "Brazil",
    confederation: "CONMEBOL",
    qualified: "Copa Libertadores Winner 2023",
    group: "G",
    logo: "fluminense.png",
  },
  {
    name: "River Plate",
    country: "Argentina",
    confederation: "CONMEBOL",
    qualified: "CONMEBOL Club Ranking",
    group: "H",
    logo: "river-plate.png",
  },
  {
    name: "Boca Juniors",
    country: "Argentina",
    confederation: "CONMEBOL",
    qualified: "CONMEBOL Club Ranking",
    group: "A",
    logo: "boca.png",
  },
  {
    name: "Botafogo",
    country: "Brazil",
    confederation: "CONMEBOL",
    qualified: "CONMEBOL Club Ranking",
    group: "B",
    logo: "botafogo.png",
  },
  
  // CONCACAF (4 teams)
  {
    name: "Monterrey",
    country: "Mexico",
    confederation: "CONCACAF",
    qualified: "CONCACAF Champions League Winner 2021",
    group: "C",
    logo: "monterrey.png",
  },
  {
    name: "Seattle Sounders",
    country: "USA",
    confederation: "CONCACAF",
    qualified: "CONCACAF Champions League Winner 2022",
    group: "D",
    logo: "sounders.png",
  },
  {
    name: "Pachuca",
    country: "Mexico",
    confederation: "CONCACAF",
    qualified: "CONCACAF Champions Cup Winner 2024",
    group: "E",
    logo: "pachuca.png",
  },
  {
    name: "Club América",
    country: "Mexico",
    confederation: "CONCACAF",
    qualified: "CONCACAF Club Ranking",
    group: "F",
    logo: "america.png",
  },
  
  // CAF (4 teams)
  {
    name: "Al Ahly",
    country: "Egypt",
    confederation: "CAF",
    qualified: "CAF Champions League Winner 2021",
    group: "G",
    logo: "al-ahly.png",
  },
  {
    name: "Wydad AC",
    country: "Morocco",
    confederation: "CAF",
    qualified: "CAF Champions League Winner 2022",
    group: "H",
    logo: "wydad.png",
  },
  {
    name: "Al Ahly",
    country: "Egypt",
    confederation: "CAF",
    qualified: "CAF Champions League Winner 2023",
    group: "A",
    logo: "al-ahly.png",
    identifier: "al-ahly-2023"
  },
  {
    name: "Espérance de Tunis",
    country: "Tunisia",
    confederation: "CAF",
    qualified: "CAF Club Ranking",
    group: "B",
    logo: "esperance.png",
  },
  
  // AFC (4 teams)
  {
    name: "Al Hilal",
    country: "Saudi Arabia",
    confederation: "AFC",
    qualified: "AFC Champions League Winner 2021",
    group: "C",
    logo: "al-hilal.png",
  },
  {
    name: "Urawa Red Diamonds",
    country: "Japan",
    confederation: "AFC",
    qualified: "AFC Champions League Winner 2022",
    group: "D",
    logo: "urawa.png",
  },
  {
    name: "Al-Ain",
    country: "UAE",
    confederation: "AFC",
    qualified: "AFC Champions League Winner 2023",
    group: "E",
    logo: "al-ain.png",
  },
  {
    name: "Ulsan HD",
    country: "South Korea",
    confederation: "AFC",
    qualified: "AFC Club Ranking",
    group: "F",
    logo: "ulsan.png",
  },
  
  // OFC (1 team)
  {
    name: "Auckland City",
    country: "New Zealand",
    confederation: "OFC",
    qualified: "OFC Champions League",
    group: "G",
    logo: "auckland.png",
  },
  
  // Host nation team (1 team)
  {
    name: "New York City FC",
    country: "USA",
    confederation: "CONCACAF",
    qualified: "Host Team",
    group: "H",
    logo: "nycfc.png",
  }
];

// Enhanced player data with more players from the Club World Cup teams
const players = [
    
]



// FIFA Club World Cup 2025 Fixtures (sample group stage matches)
const fixtures = [
  // Group A
  {
    homeTeam: "Real Madrid",
    awayTeam: "Juventus",
    date: "2025-06-15T18:00:00Z",
    venue: "MetLife Stadium, New Jersey",
    competition: "FIFA Club World Cup 2025",
    stage: "Group A"
  },
  {
    homeTeam: "Boca Juniors",
    awayTeam: "Al Ahly",
    date: "2025-06-16T20:00:00Z",
    venue: "Hard Rock Stadium, Miami",
    competition: "FIFA Club World Cup 2025",
    stage: "Group A"
  },
  
  // Group B
  {
    homeTeam: "Manchester City",
    awayTeam: "Porto",
    date: "2025-06-15T21:00:00Z",
    venue: "SoFi Stadium, Los Angeles",
    competition: "FIFA Club World Cup 2025",
    stage: "Group B"
  },
  {
    homeTeam: "Botafogo",
    awayTeam: "Espérance de Tunis",
    date: "2025-06-16T18:00:00Z",
    venue: "Levi's Stadium, San Francisco",
    competition: "FIFA Club World Cup 2025",
    stage: "Group B"
  },
  
  // Group C
  {
    homeTeam: "Chelsea",
    awayTeam: "Benfica",
    date: "2025-06-17T20:00:00Z",
    venue: "Mercedes-Benz Stadium, Atlanta",
    competition: "FIFA Club World Cup 2025",
    stage: "Group C"
  },
  {
    homeTeam: "Monterrey",
    awayTeam: "Al Hilal",
    date: "2025-06-18T18:00:00Z",
    venue: "AT&T Stadium, Dallas",
    competition: "FIFA Club World Cup 2025",
    stage: "Group C"
  },
  
  // Group D
  {
    homeTeam: "Bayern Munich",
    awayTeam: "Atlético Madrid",
    date: "2025-06-17T21:00:00Z",
    venue: "Lincoln Financial Field, Philadelphia",
    competition: "FIFA Club World Cup 2025",
    stage: "Group D"
  },
  {
    homeTeam: "Seattle Sounders",
    awayTeam: "Urawa Red Diamonds",
    date: "2025-06-18T20:00:00Z",
    venue: "Gillette Stadium, Boston",
    competition: "FIFA Club World Cup 2025",
    stage: "Group D"
  },
  
  // Sample knockout fixtures
  {
    homeTeam: "TBD",
    awayTeam: "TBD",
    date: "2025-07-10T19:00:00Z",
    venue: "MetLife Stadium, New Jersey",
    competition: "FIFA Club World Cup 2025",
    stage: "Semi-Final 1"
  },
  {
    homeTeam: "TBD",
    awayTeam: "TBD",
    date: "2025-07-11T19:00:00Z",
    venue: "SoFi Stadium, Los Angeles",
    competition: "FIFA Club World Cup 2025",
    stage: "Semi-Final 2"
  },
  {
    homeTeam: "TBD",
    awayTeam: "TBD",
    date: "2025-07-15T20:00:00Z",
    venue: "MetLife Stadium, New Jersey",
    competition: "FIFA Club World Cup 2025",
    stage: "Final"
  }
];

// Import teams, players and fixtures into DB
const importData = async () => {
  try {
    // Clear existing data
    // await Player.deleteMany();
    // await Team.deleteMany();
    
    
    await Player.insertMany(players);
    console.log('Players imported successfully!');
    
    // Optional: If you have a Fixture model, uncomment these lines
    // await Fixture.deleteMany();
    // await Fixture.insertMany(fixtures);
    // console.log('Fixtures imported successfully!');
    
    console.log('All data imported successfully!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Run the seeder
importData();