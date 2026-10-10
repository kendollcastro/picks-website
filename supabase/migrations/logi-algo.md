Algortimo MostrarModal
    //Definir abierto como Booleano
    abierto = falso

    Mientras Verdadero Hacer
        Si clicEnBotonPrincipal() Entonces
            abierto = verdadero
            Mostrar "Interfaz del Modal"
        FinSi

        Si abierto == Verdadero y clicEnCerrar() Entonces
            abierto = falso
            Ocultar "Interfaz del Modal"
        FinSi
    FinMientras
FinAlgoritmo




//---------------------------------------------------
Algoritmo CarritoCompras
    Definir contador como Entero
    Definir totalTotal como Real
    contador = 0
    totalTotal = 0

    Mientras Verdadero Hacer
        Si usuarioClicEnComprar(precio) Entonces
            contador = contador + 1
            totalTotal = totalTotal + precio
            Mostrar "Items en el carrito", contador
            Mostrar "Monto total:", totalTotal
        FinSi
    FinMientras
FinAlgoritmo
            

//---------------------------------------------------
Algoritmo ValidarContraseña
    Definir pass como Texto

    Mientras Verdadero Hacer 
        pass = leerTeclado()

        si longitud(pass) < 5 Entonces
            color = rojo
            nivel = bajo
        Sino
            si longitud(pass) < 10 Entonces
            color = amarillo
            nivel = medio

            Sino
                color = verde
                nivel = alto
            FinSi
        FinSi
    
    ActulizarInterfaz(color, nivel)
    FinMientras
FinAlgoritmo
        