const readline = require("readline");

function simulateEuroCoins() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const [
    cityStartCoins,
    coinsCorrelation,
    minCoordinateValue,
    maxCoordinateValue,
  ] = [1000000, 1000, 1, 10];

  let caseNumber = 1;
  let countries = [];
  let allCountriesNames = [];
  let cities = [];

  rl.on("line", async (line) => {
    processCountriesGroupInput(line);
  });

  async function processCountriesGroupInput(line) {
    const numCountries = validateAndGetCountriesNumber(line);

    for (let i = 0; i < numCountries; i++) {
      const countryInput = await new Promise((resolve) => {
        rl.question("", resolve);
      });

      const countryData = countryInput.split(" ");
      const [countryName, countryCoordinates] = [
        validateAndGetCountryName(countryData),
        validateAndGetCountryCoordinates(countryData),
      ];

      const country = {
        name: countryName,
        complete: false,
        daysToComplete: 0,
        ...countryCoordinates,
      };

      countries.push(country);
    }

    allCountriesNames = getAllCountriesNames(countries);

    countries.forEach((country) => {
      const countryCities = setCities(country);
      cities.push(...countryCities);
    });

    countriesHaveNeighborsValidation(countries, cities);

    simulateDissemination(countries);

    const sortedCountries = sortCountries(countries);

    logCountries(sortedCountries);

    handleCountriesEndOfInput();
  }

  function handleCountriesEndOfInput() {
    caseNumber++;
    countries = [];
    allCountriesNames = [];
    cities = [];
  }

  function validateAndGetCountriesNumber(line) {
    const input = line.split(" ");
    const numCountries = parseInt(input[0]);

    if (numCountries === 0) {
      process.exit();
    }

    if (!numCountries || numCountries < 0) {
      console.log("Invalid countries number");
      process.exit();
    }

    if (numCountries.length > 20) {
      console.log("Countries number is too big");
      process.exit();
    }

    return numCountries;
  }

  function validateAndGetCountryName(countryData) {
    const countryName = countryData[0];

    if (!countryName) {
      console.log("Country name is not defined");
      process.exit();
    }

    if (countryName.length > 25) {
      console.log("Country name is too long");
      process.exit();
    }

    return countryName;
  }

  function validateAndGetCountryCoordinates(countryData) {
    const [xl, yl, xh, yh] = [
      parseInt(countryData[1]),
      parseInt(countryData[2]),
      parseInt(countryData[3]),
      parseInt(countryData[4]),
    ];

    let hasError = false;

    if (!xl || xl < minCoordinateValue || xl > maxCoordinateValue) {
      console.log("Invalid xl coordinate");
      hasError = true;
    }

    if (!yl || yl < minCoordinateValue || yl > maxCoordinateValue) {
      console.log("Invalid yl coordinate");
      hasError = true;
    }

    if (!xh || xh < minCoordinateValue || xh > maxCoordinateValue || xh < xl) {
      console.log("Invalid xh coordinate");
      hasError = true;
    }

    if (!yh || yh < minCoordinateValue || yh > maxCoordinateValue || yh < yl) {
      console.log("Invalid yh coordinate");
      hasError = true;
    }

    hasError && process.exit();

    return {
      xl,
      yl,
      xh,
      yh,
    };
  }

  function countriesHaveNeighborsValidation(countries, allCities) {
    if (countries.length === 1) return;

    for (const country of countries) {
      const otherCountriesCities = allCities.filter(
        (city) => city.country !== country.name
      );

      const hasRelatedCountry = country.cities.some((city) => {
        const relatedCities = [
          ...getNeighborCities(city, otherCountriesCities),
          getCity(city.x, city.y, otherCountriesCities),
        ].filter((e) => e);

        return relatedCities.some(
          (relatedCity) => relatedCity.country !== city.country
        );
      });

      if (!hasRelatedCountry) {
        console.log(`Country ${country.name} doesn't have relations!`);
        process.exit();
      }
    }
  }

  function simulateDissemination(countries) {
    let day = 1;
    const daysLimit = 2000;

    while (!checkIfAllCountriesCompleted(countries) && day < daysLimit) {
      simulateDay(countries, cities, allCountriesNames, day);

      ++day;
    }
  }

  function simulateDay(countries, cities, allCountriesNames, day) {
    setStartDayCoins();
    for (const country of countries) {
      for (let x = country.xl; x <= country.xh; x++) {
        for (let y = country.yl; y <= country.yh; y++) {
          const city = getCity(x, y, cities);
          const neighborCities = getNeighborCities(city, cities);

          sendCoinsToNeighbors(city, neighborCities, coinsCorrelation);
        }
      }
    }

    handleCountriesBecameCompleted(
      countries,
      allCountriesNames,
      countries.length === 1 ? 0 : day
    );
  }

  function setStartDayCoins() {
    cities.forEach((city) => {
      // getting rid of JS Object reference
      const startDayCoins = { ...city.coins };

      city.startDayCoins = startDayCoins;
    });
  }

  function setCities(country) {
    const cities = [];

    for (let x = country.xl; x <= country.xh; x++) {
      for (let y = country.yl; y <= country.yh; y++) {
        const countryName = country.name;
        const coins = {
          [countryName]: cityStartCoins,
        };

        const city = {
          x,
          y,
          coins,
          country: countryName,
        };

        cities.push(city);
      }
    }

    country.cities = cities;

    return cities;
  }

  function getCity(x, y, cities) {
    const city = cities.find((city) => city.x === x && city.y === y);
    return city;
  }

  function getNeighborCities(city, cities) {
    const { x, y } = city;

    const [
      northCoordinates,
      eastCoordinates,
      southCoordinates,
      westCoordinates,
    ] = [
      { x, y: y - 1 },
      { x: x + 1, y },
      { x, y: y + 1 },
      {
        x: x - 1,
        y,
      },
    ];

    return cities.reduce((acc, city) => {
      checkCardinalPoints(
        city,
        northCoordinates,
        eastCoordinates,
        southCoordinates,
        westCoordinates
      ) && acc.push(city);

      return acc;
    }, []);
  }

  function checkCardinalPoints(
    city,
    northCoordinates,
    eastCoordinates,
    southCoordinates,
    westCoordinates
  ) {
    return (
      checkCityCoordinates(city, northCoordinates) ||
      checkCityCoordinates(city, eastCoordinates) ||
      checkCityCoordinates(city, southCoordinates) ||
      checkCityCoordinates(city, westCoordinates)
    );
  }

  function checkCityCoordinates(city, coordinates) {
    return city.x === coordinates.x && city.y === coordinates.y;
  }

  function getAllCountriesNames(countries) {
    return countries.map((country) => country.name);
  }

  function sendCoinsToNeighbors(city, neighborCities, coinsCorrelation) {
    for (const neighborCity of neighborCities) {
      for (const motif in city.startDayCoins) {
        const coinsToTransport = Math.floor(
          city.startDayCoins[motif] / coinsCorrelation
        );

        if (coinsToTransport > 0) {
          neighborCity.coins[motif] =
            (neighborCity.coins[motif] || 0) + coinsToTransport;
          city.coins[motif] -= coinsToTransport;
        }
      }
    }
  }

  function isCityComplete(city, allCountriesNames) {
    return allCountriesNames.every((motif) => city.coins[motif]);
  }

  function checkIfAllCountriesCompleted(countries) {
    return countries.every((country) => country.complete);
  }

  function countryBecameComplete(country, allCountriesNames) {
    return (
      !country.complete &&
      country.cities.every((city) => isCityComplete(city, allCountriesNames))
    );
  }

  function handleCountriesBecameCompleted(countries, allCountriesNames, day) {
    for (const country of countries) {
      if (countryBecameComplete(country, allCountriesNames)) {
        country.complete = true;
        country.daysToComplete = day;
      }
    }
  }

  function sortCountries(countries) {
    return countries.sort((a, b) => {
      if (a.daysToComplete < b.daysToComplete) {
        return -1;
      }
      if (a.daysToComplete > b.daysToComplete) {
        return 1;
      }

      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }

      return 0;
    });
  }

  function logCountries(sortedCountries) {
    console.log(`Case ${caseNumber}:`);
    sortedCountries.forEach((country) => {
      console.log(`${country.name} ${country.daysToComplete}`);
    });
  }
}

simulateEuroCoins();
