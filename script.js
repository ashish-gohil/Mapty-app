'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// let map; // as unique for any functionality/object

class App {
  #map;
  #mapObj;
  #mapTilerAPIKey; // mailtiler api(acc:ashishgohil1408@gmail.com)
  #workouts = [];
  #workout;
  constructor() {
    this._getPosition();
    inputType.addEventListener('change', this._toggleElevationField);
    form.addEventListener('submit', this._newWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._setToView.bind(this));
  }

  _setToView(e) {
    if (e.target.closest('.workout')) {
      const workoutEl = e.target.closest('.workout');
      this.#map.setView(
        this.#workouts.find(workout => workout.id === +workoutEl.dataset.id)
          .coords,
        13
      );
    }
  }

  _getPosition() {
    // get current cords and load map
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this), //pass case
        () => alert('No cordinates found!') //fail case
      );
    }
  }

  _loadMap(pos) {
    // console.log(pos);
    const { latitude, longitude } = pos.coords;
    this.cords = [latitude, longitude];
    this.#map = L.map('map').setView(this.cords, 13); //starting position
    this.#mapTilerAPIKey = '7jhsdVvzLqojweSKi9GI';

    L.maplibreGL({
      style: `https://api.maptiler.com/maps/0aa52e5b-d426-48b5-97c8-7ffa65664819/style.json?key=${
        this.#mapTilerAPIKey
      }`,
    }).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));
    this._loadWorkoutsFromLocal();
  }

  _storeWorkoutsInLocal() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _loadWorkoutsFromLocal() {
    if (localStorage.getItem('workouts')) {
      this.#workouts = JSON.parse(localStorage.getItem('workouts'));
      console.log(this.#workouts);
      this.#workouts.forEach(work => {
        this.#workout = work;
        this._renderMarkerAndPopup(work.coords);
        this._randerWorkoutList();
      });
    }
  }

  _showForm(mapE) {
    this.#mapObj = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _isFinite(...inputes) {
    return inputes.every(val => isFinite(+val));
  }
  _isPositive(...inputes) {
    return inputes.every(val => +val > 0);
  }

  _renderMarkerAndPopup(latlng) {
    L.marker(latlng)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxwidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${this.#workout.workoutType}-popup`,
        })
      )
      .setPopupContent(`${this.#workout.description}`)
      .openPopup();
  }

  _randerWorkoutList() {
    let html = `
    <li class="workout workout--${this.#workout.workoutType}" data-id='${
      this.#workout.id
    }'>
      <h2 class="workout__title">${this.#workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          this.#workout.workoutType === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${this.#workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${this.#workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>`;

    if (this.#workout.workoutType === 'running') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${this.#workout.tpk.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${this.#workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
   </li>`;
    }
    if (this.#workout.workoutType === 'cycling') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${this.#workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${this.#workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _newWorkout(e) {
    e.preventDefault();
    const { lat, lng } = this.#mapObj.latlng; // clicked coords

    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    if (inputType.value === 'running') {
      const cadence = +inputCadence.value;
      if (
        !this._isFinite(cadence, duration, distance) ||
        !this._isPositive(cadence, duration, distance)
      ) {
        alert('Inputs have to be positive numbers!');
        return;
      }
      this.#workout = new Running(distance, duration, cadence, [lat, lng]);
    }
    if (inputType.value === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !this._isFinite(elevation, duration, distance) ||
        !this._isPositive(duration, distance)
      ) {
        alert('Inputs have to be positive numbers!');
        return;
      }
      this.#workout = new Cycling(distance, duration, elevation, [lat, lng]);
    }
    this.#workouts.push(this.#workout);
    this._renderMarkerAndPopup([lat, lng]);
    this._hideForm();
    this._randerWorkoutList();
    this._storeWorkoutsInLocal();
  }
}

const app = new App();

class Workout {
  constructor(distance, duration, coords) {
    this.id = Date.now();
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
    this.date = new Intl.DateTimeFormat(navigator.language, {
      // year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date());
  }
  createDiscription() {
    return `${
      this.workoutType === 'running' ? '🏃‍♂️' : '🚴‍♀️'
    } ${this.workoutType[0].toUpperCase()}${this.workoutType.slice(1)} on ${
      this.date
    }`;
  }
}

class Running extends Workout {
  workoutType = 'running';
  constructor(distance, duration, cadence, coords) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.description = this.createDiscription();
    this.calTimePerKm();
  }
  calTimePerKm() {
    this.tpk = this.duration / this.distance;
  }
}

class Cycling extends Workout {
  workoutType = 'cycling';
  constructor(distance, duration, elevationGain, coords) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.description = this.createDiscription();
    this.calSpeed();
  }
  calSpeed() {
    this.speed = (this.distance * 60) / this.duration;
  }
}
function clearLocalStorage() {
  localStorage.removeItem('workouts');
  location.reload();
}
