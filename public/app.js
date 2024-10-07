// Importando o Firebase SDK e os serviços que você precisa
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD-rq2PqJePznyVKMzvHZqoyH5saomUNXk",
  authDomain: "sorteadoramigo.firebaseapp.com",
  projectId: "sorteadoramigo",
  storageBucket: "sorteadoramigo.appspot.com",
  messagingSenderId: "400425000378",
  appId: "1:400425000378:web:6f88c534841971c1805183",
  measurementId: "G-0GYRQN6260"
};

// Inicializando o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// E-mail do administrador
const adminEmail = "admin@sorteadoramigo.com";

// Função de login
$("#loginBtn").click(() => {
    const email = $("#email").val();
    const password = $("#password").val();
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            $("#loginForm").hide();
            $("#sorteioSection").show();
            $("#userName").text(user.email);
            if (user.email === adminEmail) {
                $("#adminPanel").show(); // Mostrar o painel de gerenciamento para o admin
                loadAdminPanel(); // Carregar dados no painel de gerenciamento
            } else {
                showSecretFriend(user.uid);  // Mostrar o amigo secreto sorteado para usuários normais
            }
        })
        .catch((error) => {
            alert("Erro no login: " + error.message);
        });
});

// Função de registro
$("#signupBtn").click(async () => {
    const email = $("#email").val();
    const password = $("#password").val();
    const name = $("#name").val();  // Capturando o nome do usuário

    if (!name || !email) {
        alert("Nome e e-mail são obrigatórios.");
        return;
    }

    // Verificar se o e-mail já existe no Firestore
    const q = query(collection(db, "participantes"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        alert("Este e-mail já está cadastrado!");
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            // Armazenando o nome e o email do usuário no Firestore
            setDoc(doc(db, "participantes", user.uid), {
                nome: name,
                email: user.email,
                amigoSorteado: ""  // Inicialmente sem amigo sorteado
            }).then(() => {
                alert("Usuário registrado com sucesso!");
            }).catch((error) => {
                alert("Erro ao salvar no banco de dados: " + error.message);
            });
        })
        .catch((error) => {
            alert("Erro no registro: " + error.message);
        });
});

// Função para mostrar o amigo secreto do participante
function showSecretFriend(userId) {
    const userRef = doc(db, "participantes", userId);
    getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
            const amigoSorteado = docSnapshot.data().amigoSorteado;
            if (amigoSorteado) {
                $("#amigoSorteado").text("Seu amigo secreto é: " + amigoSorteado);
            } else {
                $("#amigoSorteado").text("O sorteio ainda não foi realizado.");
            }
        }
    }).catch((error) => {
        console.error("Erro ao verificar o amigo secreto: ", error);
    });
}

// Adicionar o usuário ao Firestore após o login
onAuthStateChanged(auth, (user) => {
    if (user) {
        $("#sortearBtn").hide();  // Esconde o botão para usuários normais
        showSecretFriend(user.uid);
    }
});

// Função que só o administrador usa para realizar o sorteio
$("#adminSortearBtn").click(() => {
    const participantesRef = collection(db, "participantes");
    getDocs(participantesRef).then((querySnapshot) => {
        const participantes = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            participantes.push({
                id: doc.id,
                nome: data.nome,
                email: data.email
            });
        });

        if (participantes.length < 2) {
            alert("É necessário ao menos 2 participantes para realizar o sorteio.");
            return;
        }

        // Realizar o sorteio de amigos secretos
        const sorteio = realizarSorteio(participantes);

        // Atualizar o Firestore com os resultados do sorteio
        sorteio.forEach((par) => {
            const { id, amigoSorteado } = par;
            updateDoc(doc(db, "participantes", id), {
                amigoSorteado: amigoSorteado.nome  // Atualizando o nome do amigo secreto
            });
        });

        alert("Sorteio realizado com sucesso!");
        loadAdminPanel(); // Atualizar o painel de gerenciamento com o sorteio
    }).catch((error) => {
        console.error("Erro ao pegar os participantes: ", error);
    });
});

// Função para realizar o sorteio (lógica embaralhada sem repetição)
function realizarSorteio(participantes) {
    const shuffled = [...participantes];
    let sorteio = [];

    // Embaralha a lista de participantes
    shuffled.sort(() => 0.5 - Math.random());

    for (let i = 0; i < participantes.length; i++) {
        const sorteador = participantes[i];
        const amigoSorteado = shuffled[(i + 1) % participantes.length];  // Garante que ninguém sorteia a si mesmo
        sorteio.push({ id: sorteador.id, amigoSorteado });
    }

    return sorteio;
}

// Função para carregar o painel de administração
function loadAdminPanel() {
    const participantesRef = collection(db, "participantes");
    getDocs(participantesRef).then((querySnapshot) => {
        const participantes = [];
        const resultados = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            participantes.push({
                nome: data.nome,
                email: data.email
            });
            if (data.amigoSorteado) {
                resultados.push({
                    nome: data.nome,
                    sorteado: data.amigoSorteado
                });
            }
        });

        // Exibir os participantes cadastrados
        let participantesContent = "";
        participantes.forEach((p) => {
            participantesContent += `
                <tr>
                    <td>${p.nome}</td>
                    <td>${p.email}</td>
                </tr>`;
        });
        $("#participantesTable tbody").html(participantesContent);

        // Exibir os resultados do sorteio
        let resultadosContent = "";
        resultados.forEach((r) => {
            resultadosContent += `
                <tr>
                    <td>${r.nome}</td>
                    <td>${r.sorteado}</td>
                </tr>`;
        });
        $("#resultadosTable tbody").html(resultadosContent);
    }).catch((error) => {
        console.error("Erro ao carregar participantes: ", error);
    });
}
