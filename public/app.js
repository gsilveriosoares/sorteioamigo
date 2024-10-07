// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD-rq2PqJePznyVKMzvHZqoyH5saomUNXk",
  authDomain: "sorteadoramigo.firebaseapp.com",
  projectId: "sorteadoramigo",
  storageBucket: "sorteadoramigo.appspot.com",
  messagingSenderId: "400425000378",
  appId: "1:400425000378:web:6f88c534841971c1805183",
  measurementId: "G-0GYRQN6260"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Função de login
$("#loginBtn").click(() => {
    const email = $("#email").val();
    const password = $("#password").val();
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            $("#loginForm").hide();
            $("#sorteioSection").show();
            $("#userName").text(user.email);
        })
        .catch((error) => {
            alert("Erro no login: " + error.message);
        });
});

// Função de registro
$("#signupBtn").click(() => {
    const email = $("#email").val();
    const password = $("#password").val();
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert("Usuário registrado com sucesso!");
        })
        .catch((error) => {
            alert("Erro no registro: " + error.message);
        });
});

// Função de sorteio
$("#sortearBtn").click(() => {
    const user = auth.currentUser;

    // Pegando todos os participantes do Firestore
    db.collection("participantes").get().then((querySnapshot) => {
        const participantes = [];
        querySnapshot.forEach((doc) => {
            if (doc.data().email !== user.email) {  // Evita sortear a si mesmo
                participantes.push(doc.data().email);
            }
        });

        // Sorteando um amigo secreto
        if (participantes.length > 0) {
            const amigo = participantes[Math.floor(Math.random() * participantes.length)];
            $("#amigoSorteado").text("Seu amigo secreto é: " + amigo);
        } else {
            $("#amigoSorteado").text("Nenhum participante disponível para o sorteio.");
        }
    }).catch((error) => {
        console.error("Erro ao pegar os participantes: ", error);
    });
});

// Adicionar o usuário ao Firestore após o login
auth.onAuthStateChanged((user) => {
    if (user) {
        const userRef = db.collection("participantes").doc(user.uid);
        userRef.set({
            email: user.email
        }).catch((error) => {
            console.error("Erro ao adicionar participante: ", error);
        });
    }
});
