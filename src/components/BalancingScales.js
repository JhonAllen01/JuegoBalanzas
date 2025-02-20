/* eslint-disable prettier/prettier */

import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, Alert } from 'react-native'; // Importa TextInput para obtener la entrada del usuario
import GuessColorModal from './GuessColorModal';
import Textarea from 'react-native-textarea';
import { styles } from '../css/styles';
import { useCallback } from 'react';


const BalancingScales = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [mensajes, setMensajes] = useState('');
    const [userInput, setUserInput] = useState(''); // Estado para almacenar la entrada del usuario

    const addToLog = useCallback((message) => {
        setMensajes(prevMensajes => prevMensajes + message + '\n');
    }, []);

    const alert = (title, message, buttons = []) => {
        Alert.alert(title, message, buttons);
    };

    // Define possible weights of minerals
    const possibleWeights = Array.from({ length: 30 }, (_, i) => i + 1); // Weights between 1 and 30 grams

    const generateMineralWeights = useCallback(() => {
        const weights = [];
        const mineralNames = [];
        const colors = ['red', 'yellow', 'green', 'blue', 'violet'];

        colors.forEach(color => {
            const weight = possibleWeights[Math.floor(Math.random() * possibleWeights.length)];
            for (let i = 1; i <= 2; i++) {
                const name = `${color.charAt(0).toUpperCase() + color.slice(1)} ${i}`;
                weights.push(weight);
                mineralNames.push(name);
            }
        });

        return [weights, mineralNames];
    }, [possibleWeights]);

    const playRound = useCallback(() => {
        const [mineralWeights, mineralNames] = generateMineralWeights();
        const mainScale = [[], []]; // [left_minerals, right_minerals]
        const remainingMinerals = { red: 2, yellow: 2, green: 2, blue: 2, violet: 2 };

        // Reveal weight of a random mineral
        const revealedMineralIndex = Math.floor(Math.random() * 10);
        const revealedWeight = mineralWeights[revealedMineralIndex];
        const revealedColor = mineralNames[revealedMineralIndex].split(' ')[0].toLowerCase();
        addToLog(`The weight of ${revealedColor} minerals is: ${revealedWeight} grams`);

        let isFirstTurn = true;

        while (true) {
            if (!isFirstTurn) {
                addToLog('\nMain scale:');
                addToLog('Left:', mainScale[0].join(', '));
                addToLog('Right:', mainScale[1].join(', '));
            }

            const leftWeight = mainScale[0].reduce((acc, mineral) => acc + mineralWeights[mineralNames.indexOf(mineral)], 0);
            const rightWeight = mainScale[1].reduce((acc, mineral) => acc + mineralWeights[mineralNames.indexOf(mineral)], 0);

            if (!isFirstTurn) {
                if (leftWeight > rightWeight) {
                    addToLog('The left side is heavier.');
                } else if (leftWeight < rightWeight) {
                    addToLog('The right side is heavier.');
                } else {
                    addToLog('The scale is balanced.');
                }
            }

            addToLog('\nRemaining minerals:');
            for (const [color, quantity] of Object.entries(remainingMinerals)) {
                addToLog(`${color.charAt(0).toUpperCase() + color.slice(1)}: ${quantity}`);
            }

            const option = Alert.alert(
                'Options',
                "Enter 'p' to place a mineral or 'g' to guess the weights:",
                [
                    { text: 'Place a mineral', onPress: () => 'p' },
                    { text: 'Guess the weights', onPress: () => 'g' },
                ],
                { cancelable: false }
            );

            switch (option) {
                case 'p':
                    // Implementa la lógica para colocar un mineral
                    const mineralColor = Alert.alert(
                        'Enter Mineral Color',
                        'Choose the color of the mineral you want to place:',
                        [
                            { text: 'Red', onPress: () => 'red' },
                            { text: 'Yellow', onPress: () => 'yellow' },
                            { text: 'Green', onPress: () => 'green' },
                            { text: 'Blue', onPress: () => 'blue' },
                            { text: 'Violet', onPress: () => 'violet' },
                        ],
                        { cancelable: false }
                    );

                    if (!(mineralColor in remainingMinerals) || remainingMinerals[mineralColor] === 0) {
                        addToLog('There are no minerals available in that color.');
                        continue;
                    }

                    const side = Alert.alert(
                        'Enter Side',
                        'Choose the side where you want to place the mineral:',
                        [
                            { text: 'Left', onPress: () => 'l' },
                            { text: 'Right', onPress: () => 'r' },
                        ],
                        { cancelable: false }
                    );

                    if (side !== 'l' && side !== 'r') {
                        addToLog('Invalid side. Enter \'l\' for left or \'r\' for right.');
                        continue;
                    }

                    const placedMineralIndex = mineralNames.findIndex(mineral => mineral.toLowerCase().includes(mineralColor) && !mainScale[0].includes(mineral) && !mainScale[1].includes(mineral));
                    if (placedMineralIndex !== -1) {
                        const placedMineral = mineralNames[placedMineralIndex];
                        remainingMinerals[mineralColor]--;
                        if (side === 'l') {
                            mainScale[0].push(placedMineral);
                        } else {
                            mainScale[1].push(placedMineral);
                        }
                    }
                    break;

                case 'g':
                    // Implementa la lógica para adivinar los pesos
                    // Aqui hay que llamar a la modal que hizo jose, jalar los datos a la modal y regresar el resultado
                    if (mainScale[0].length !== mainScale[1].length) {
                        addToLog('The scale is not balanced. You cannot guess the weights yet.');
                        continue;
                    }

                    const guesses = {};
                    const incorrectGuesses = [];
                    for (let i = 0; i < 10; i++) {
                        const color = mineralNames[i].split(' ')[0].toLowerCase();
                        if (!(color in guesses)) {
                            let guess;
                            while (isNaN(guess) || guess === null) {
                                guess = parseInt(Alert.alert(`Enter your estimation for the weight of ${color} minerals:`), 10);
                                if (isNaN(guess)) {
                                    addToLog('Error: Please enter a valid integer.');
                                }
                            }
                            guesses[color] = guess;
                        }
                    }

                    // Compare guessed weights with the actual ones
                    for (const [color, guessedWeight] of Object.entries(guesses)) {
                        if (guessedWeight !== mineralWeights[mineralNames.indexOf(`${color.charAt(0).toUpperCase() + color.slice(1)} 1`)]) {
                            incorrectGuesses.push(color);
                        }
                    }

                    if (incorrectGuesses.length === 0) {
                        addToLog('Congratulations! You have correctly guessed all the weights.');
                        return true;
                    } else {
                        addToLog('Sorry, you failed to guess the weight of the following minerals:');
                        incorrectGuesses.forEach(color => console.log(color.charAt(0).toUpperCase() + color.slice(1)));
                        addToLog('You lost the round.');
                        addToLog('The real weights of the minerals are:');
                        const printedColors = new Set();
                        for (let i = 0; i < mineralNames.length; i++) {
                            const color = mineralNames[i].split(' ')[0].toLowerCase();
                            if (color in remainingMinerals && !printedColors.has(color)) {
                                addToLog(`The ${color} minerals weigh: ${mineralWeights[i]} grams`);
                                printedColors.add(color);
                            }
                        }
                        return false;
                    }
                default:
                    addToLog("Invalid option. Enter 'p' or 'g'.");
                    break;
            }

            isFirstTurn = false;
        }
    }, [generateMineralWeights, addToLog]);



    // eslint-disable-next-line no-unused-vars
    const main = useCallback(() => {
        let playAgain = 'y';
        while (playAgain === 'y') {
            const result = playRound();
            if (result) {
                addToLog('You won the round!');
            }
            playAgain = alert('Do you want to play again? (y/n): ', '', [
                { text: 'Yes', onPress: () => { addToLog('playAgain'); return 'y'; } },
                { text: 'No', onPress: () => 'n' },
            ]);
        }
        addToLog('Game over.');
    }, [addToLog, playRound]);

    //Ejecuta la primer vez que abre la app
    //En teoria tiene que llamar a main(), y en el [] de abajo tiene que estar main, pero algo pasa con los alerts que sobre carga la aplicacion, la relentiza y la cierra
    //Entonces una propuesta es hacer los propios modales
    useEffect(() => {
        console.log('Ejecutando useEffect');
        addToLog('Welcome to Balancing Scales!');
    }, [addToLog]);

    const openModal = () => {
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
    };

    const handleGuess = (guessedCorrectly) => {
        addToLog('Guessed correctly: ' + guessedCorrectly);
        closeModal();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Balancing Scales</Text>
            <Textarea
                containerStyle={styles.textareaContainer}
                style={styles.textarea}
                value={mensajes}
                editable={false}
            />
            <Button title="Adivinar colores" onPress={openModal} />
            <GuessColorModal visible={modalVisible} onClose={closeModal} onGuess={handleGuess} />
            {/* TextInput para obtener la entrada del usuario */}
            <TextInput
                value={userInput} // Usa el estado userInput aquí
                style={styles.texto}
                multiline={true}
                placeholder="Escribe aquí..."
                onChangeText={(newValue) => setUserInput(newValue)}
            />
            <Button
                title="Enviar"
                onPress={() => {
                    addToLog(userInput);
                    setUserInput(''); // Limpia el estado userInput después de agregarlo a los mensajes
                }}
            />
        </View>
    );
};

export default BalancingScales;
