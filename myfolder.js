const express = require("express");
const app = express();

app.use(express.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE, HEAD"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

var port = process.env.PORT||2410;
app.listen(port, () => console.log(`Listening on port ${port}!`));

const { movies, users } = require("./data.js");

app.get("/movies", (req, res) => {
  res.json(movies);
});
app.post("/login", function (req, res) {
  var email = req.body.email;

  var cust = users.find(function (item) {
    return item.email === email;
  });
  console.log(cust);
  var custRec = {
    email:cust.email,
    fname: cust.fname,
    lname: cust.lname,
    married: cust.married,
    mobile:cust.mobile
  };
  res.send(custRec);
});

app.get("/movies/:city", (req, res) => {
  const city = req.params.city;
  const { q, lang, format, genre } = req.query;

  let filteredMovies = movies.filter((movie) =>
    movie.theaters.some((theater) => theater.city === city)
  );

  if (q) {
    // Filter by title containing the query string
    filteredMovies = filteredMovies.filter((movie) =>
      movie.title.toLowerCase().includes(q.toLowerCase())
    );
  }

  if (lang) {
    // Filter by language(s)
    const languages = lang.split(",");
    filteredMovies = filteredMovies.filter((movie) =>
      languages.includes(movie.language)
    );
  }

  if (format) {
    // Filter by format
    filteredMovies = filteredMovies.filter(
      (movie) => movie.format.toLowerCase() === format.toLowerCase()
    );
  }

  if (genre) {
    // Filter by genre
    filteredMovies = filteredMovies.filter(
      (movie) => movie.genre.toLowerCase() === genre.toLowerCase()
    );
  }

  res.json(filteredMovies);
});
// ... (other middleware and setup)

// Get a specific movie by city and ID
app.get("/movies/:city/:id", (req, res) => {
  const city = req.params.city;
  const movieId = parseInt(req.params.id);

  const cityMovies = movies.filter((movie) =>
    movie.theaters.some((theater) => theater.city === city)
  );

  const movie = cityMovies.find((movie) => movie.id === movieId);

  if (movie) {
    res.json(movie);
  } else {
    res.status(404).json({ message: "Movie not found in the specified city" });
  }
});

// Get a specific movie by ID
app.get("/movie/:id", (req, res) => {
  const movieId = parseInt(req.params.id);
  const movie = movies.find((movie) => movie.id === movieId);

  if (movie) {
    res.json(movie);
  } else {
    res.status(404).json({ message: "Movie not found" });
  }
});

// Get available seats for a specific movie and theater
app.get("/app/seats", (req, res) => {
  const { title, movieHall, time, date } = req.query;

  if (!title || !movieHall || !time || !date) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  // Find the movie based on title
  const movie = movies.find((m) => m.title === title);

  if (!movie) {
    return res.status(404).json({ error: "Movie not found" });
  }

  // Find the theater based on movieHall
  const theater = movie.theaters.find((t) => t.name === movieHall);

  if (!theater) {
    return res
      .status(404)
      .json({ error: "Theater not found for the specified movie" });
  }

  // Find the seats based on time and date
  const seats = theater.seats[time];

  if (!seats) {
    return res.status(404).json({
      error: "No seating information available for the specified time",
    });
  }

  // Return the available seats for the specified time and date
  res.json({ availableSeats: seats, time, date });
});

app.post("/seat", (req, res) => {
  const { title, movieHall, tickets, amount, time, date } = req.body;

  if (!title || !movieHall || !tickets || !amount || !time || !date) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  // Find the movie based on title
  const movie = movies.find((m) => m.title === title);

  if (!movie) {
    return res.status(404).json({ error: "Movie not found" });
  }

  // Find the theater based on movieHall
  const theater = movie.theaters.find((t) => t.name === movieHall);

  if (!theater) {
    return res
      .status(404)
      .json({ error: "Theater not found for the specified movie" });
  }

  // Check if the selected time is available
  if (!theater.seats || !theater.seats[time]) {
    return res.status(404).json({
      error: "Seating information not available for the specified time",
    });
  }

  const availableSeats = theater.seats[time];

  // Check if the selected seats are available
  const invalidSeats = tickets.filter((seat) => !availableSeats.includes(seat));

  if (invalidSeats.length > 0) {
    return res
      .status(400)
      .json({ error: `Seats ${invalidSeats.join(", ")} are not available` });
  }

  // Update the seats array to mark booked seats
  theater.seats[time] = availableSeats.filter(
    (seat) => !tickets.includes(seat)
  );

  // In a real application, you would probably want to store the booking information in a database

  // Return a response with booking details
  res.json({
    title,
    movieHall,
    tickets,
    amount,
    time,
    date,
    message: "Seats booked successfully",
  });
});
