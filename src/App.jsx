import { useCallback, useEffect, useRef, useState } from "react";
import Places from "./components/Places.jsx";
import Modal from "./components/Modal.jsx";
import DeleteConfirmation from "./components/DeleteConfirmation.jsx";
import logoImg from "./assets/logo.png";
import AvailablePlaces from "./components/AvailablePlaces.jsx";
import { fetchUserPlaces, updateUserPlaces } from "./http.js";
import Error from "./components/Error.jsx";

function App() {
  const selectedPlace = useRef();

  const [pickedPlaces, setPickedPlaces] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState();

  const [errorUpdatingPlaces, setErrorUpdatingPlaces] = useState();

  const [modalIsOpen, setModalIsOpen] = useState(false);

  useEffect(() => {
    async function fetchPlaces(params) {
      setIsFetching(true);

      try {
        const userPlaces = await fetchUserPlaces();
        setPickedPlaces(userPlaces);
      } catch (error) {
        setError({
          message: error.message || "Error fetching user places!",
        });
      }

      setIsFetching(false);
    }

    fetchPlaces();
  }, []);

  function handleStartRemovePlace(id) {
    setModalIsOpen(true);
    selectedPlace.current = id;
  }

  function handleStopRemovePlace() {
    setModalIsOpen(false);
  }

  async function handleSelectPlace(selectedPlace) {
    setPickedPlaces((prevPickedPlaces) => {
      if (!prevPickedPlaces) {
        prevPickedPlaces = [];
      }
      if (prevPickedPlaces.some((place) => place.id === selectedPlace.id)) {
        return prevPickedPlaces;
      }
      return [selectedPlace, ...prevPickedPlaces];
    });

    try {
      await updateUserPlaces([selectedPlace, ...pickedPlaces]);
    } catch (error) {
      setPickedPlaces(pickedPlaces);
      setErrorUpdatingPlaces({
        message: error.message || "Error updating places!",
      });
    }
  }

  const handleRemovePlace = useCallback(
    async function handleRemovePlace() {
      setPickedPlaces((prevPickedPlaces) =>
        prevPickedPlaces.filter(
          (place) => place.id !== selectedPlace.current.id
        )
      );

      setModalIsOpen(false);

      try {
        await updateUserPlaces(
          pickedPlaces.filter((place) => place.id !== selectedPlace.id)
        );
      } catch (error) {
        setPickedPlaces(pickedPlaces);
        setErrorUpdatingPlaces({
          message: error.message || "Error deleting place",
        });
      }
    },
    [pickedPlaces]
  );

  function handleError() {
    setErrorUpdatingPlaces();
  }

  return (
    <>
      <Modal open={errorUpdatingPlaces} onClose={handleError}>
        {errorUpdatingPlaces && (
          <Error
            title="An error occurred!"
            message={errorUpdatingPlaces.message}
            onConfirm={handleError}
          />
        )}
      </Modal>

      <Modal open={modalIsOpen} onClose={handleStopRemovePlace}>
        <DeleteConfirmation
          onCancel={handleStopRemovePlace}
          onConfirm={handleRemovePlace}
        />
      </Modal>

      <header>
        <img src={logoImg} alt="Stylized globe" />
        <h1>PlacePicker</h1>
        <p>
          Create your personal collection of places you would like to visit or
          you have visited.
        </p>
      </header>
      <main>
        {error && <Error title="An error occurred!" message={error.message} />}

        {!error && (
          <Places
            title="I'd like to visit ..."
            loadingText="Fetching your places..."
            isLoading={isFetching}
            fallbackText={"Select the places you would like to visit below."}
            places={pickedPlaces}
            onSelectPlace={handleStartRemovePlace}
          />
        )}

        <AvailablePlaces onSelectPlace={handleSelectPlace} />
      </main>
    </>
  );
}

export default App;
