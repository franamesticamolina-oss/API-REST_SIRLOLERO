const boton = document.getElementById("Crear");
const resultado = document.getElementById("resultado");

boton.addEventListener("click", async () => {
    try {
        const respuesta = await fetch("http://localhost:3000/usuario/");

        if (!respuesta.ok) {
            throw new Error("La consulta falló");
        }

        resultado.textContent = await respuesta.text();
    } catch (error) {
        resultado.textContent = error.message;
    }
});