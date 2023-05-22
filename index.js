const readline = require("readline");

function simulateEuroCoins() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let caseNumber = 1;
  let countries = [];
  let cities = [];

  rl.on("line", async (line) => {
    const input = line.split(" ");
    const numCountries = parseInt(input[0]);

    if (numCountries === 0) {
      process.exit();
    }

    for (let i = 0; i < numCountries; i++) {
      const countryInput = await new Promise((resolve) => {
        rl.question("", resolve);
      });

      // @TODO add validations
      const countryData = countryInput.split(" ");
      const country = {
        name: countryData[0],
        xl: parseInt(countryData[1]),
        yl: parseInt(countryData[2]),
        xh: parseInt(countryData[3]),
        yh: parseInt(countryData[4]),
        complete: false,
        daysToComplete: 0,
      };
      countries.push(country);
    }

    // @TODO
    countries.forEach((country) => setCities(country));
    cities = countries.flatMap((country) => country.cities);

    simulateDissemination(countries);

    const sortedCountries = countries.sort((a, b) => {
      if (a.daysToComplete === b.daysToComplete) {
        return a.name.localeCompare(b.name);
      } else {
        return a.daysToComplete - b.daysToComplete;
      }
    });

    console.log(`Case ${caseNumber}:`);
    sortedCountries.forEach((country) => {
      console.log(`${country.name} ${country.daysToComplete}`);
    });

    caseNumber++;
    countries = [];
  });

  function simulateDissemination(countries) {
    let completeCountries = 0;
    let day = 1;
    const daysLimit = 2000;

    while (completeCountries < countries.length && day < daysLimit) {
      for (const country of countries) {
        for (let x = country.xl; x <= country.xh; x++) {
          for (let y = country.yl; y <= country.yh; y++) {
            const city = getCity(x, y, cities);
            const neighborCities = getNeighborCities(city, cities);
            const valueToSend = 1000;

            for (const neighborCity of neighborCities) {
              for (const motif in city.startDayCoins) {
                const coinsToTransport = Math.floor(
                  city.startDayCoins[motif] / valueToSend
                );

                if (coinsToTransport > 0) {
                  neighborCity.coins[motif] =
                    (neighborCity.coins[motif] || 0) + coinsToTransport;
                  city.coins[motif] -= coinsToTransport;
                }
              }
            }
          }

          if (
            !country.complete &&
            country.cities.every((city) => isCityComplete(city))
          ) {
            country.complete = true;
            country.daysToComplete = day;
            completeCountries++;
          }
        }
      }

      cities = cities.map((city) => ({
        ...city,
        // @TODO JS tricky!!
        startDayCoins: { ...city.coins },
      }));

      ++day;
    }
  }

  function setCities(country) {
    const cities = [];
    const startCoins = 1000000;

    for (let x = country.xl; x <= country.xh; x++) {
      for (let y = country.yl; y <= country.yh; y++) {
        const countryName = country.name;
        const coins = {
          [countryName]: startCoins,
        };

        const city = {
          x,
          y,
          coins,
          // @TODO JS tricky!!
          startDayCoins: { ...coins },
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
    const neighbors = [];

    // Check if there is a neighbor city to the north
    const northCity = cities.find(
      (neighbor) => neighbor.x === x && neighbor.y === y - 1
    );
    if (northCity) {
      neighbors.push(northCity);
    }

    // Check if there is a neighbor city to the east
    const eastCity = cities.find(
      (neighbor) => neighbor.x === x + 1 && neighbor.y === y
    );
    if (eastCity) {
      neighbors.push(eastCity);
    }

    // Check if there is a neighbor city to the south
    const southCity = cities.find(
      (neighbor) => neighbor.x === x && neighbor.y === y + 1
    );
    if (southCity) {
      neighbors.push(southCity);
    }

    // Check if there is a neighbor city to the west
    const westCity = cities.find(
      (neighbor) => neighbor.x === x - 1 && neighbor.y === y
    );
    if (westCity) {
      neighbors.push(westCity);
    }

    return neighbors;
  }

  function isCityComplete(city) {
    // @TODO can i move it on top?
    const countriesNames = countries.map((country) => country.name);

    return countriesNames.every(
      (motif) => city.coins[motif] && city.coins[motif] !== 0
    );
  }
}

simulateEuroCoins();
