const readline = require("readline");

function simulateEuroCoins() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const cityStartCoins = 1000000;
  const coinsCorrelation = 1000;

  let caseNumber = 1;
  let countries = [];
  let cities = [];

  rl.on("line", async (line) => {
    processCountriesGroupInput(line);
  });

  async function processCountriesGroupInput(line) {
    const input = line.split(" ");
    const numCountries = parseInt(input[0]);

    if (numCountries === 0) {
      process.exit();
    }

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

    countries.forEach((country) => {
      const countryCities = setCities(country);
      cities.push(...countryCities);
    });

    simulateDissemination(countries);

    const sortedCountries = sortCountries(countries);

    logCountries(sortedCountries);

    caseNumber++;
    countries = [];
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
  }

  function validateAndGetCountryCoordinates(countryData) {
    const [xl, yl, xh, yh] = [
      parseInt(countryData[1]),
      parseInt(countryData[2]),
      parseInt(countryData[3]),
      parseInt(countryData[4]),
    ];

    let hasError = false;

    if (!xl || xl < 1 || xl > 10) {
      console.log("Invalid xl coordinate");
      hasError = true;
    }

    if (!yl || yl < 1 || yl > 10) {
      console.log("Invalid yl coordinate");
      hasError = true;
    }

    if (!xh || xh < 1 || xh > 10) {
      console.log("Invalid xh coordinate");
      hasError = true;
    }

    if (!yh || yh < 1 || yh > 10) {
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

  function simulateDissemination(countries) {
    let day = 1;
    const daysLimit = 2000;

    const allCountriesNames = getAllCountriesNames(countries);

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

        handleCountryBecameCompleted(
          country,
          allCountriesNames,
          countries.length === 1 ? 0 : day
        );
      }
    }
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

  function handleCountryBecameCompleted(country, allCountriesNames, day) {
    if (countryBecameComplete(country, allCountriesNames)) {
      country.complete = true;
      country.daysToComplete = day;
    }
  }

  function sortCountries(countries) {
    return countries.sort((a, b) => {
      if (a.daysToComplete === b.daysToComplete) {
        return a.name.localeCompare(b.name);
      } else {
        return a.daysToComplete - b.daysToComplete;
      }
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
