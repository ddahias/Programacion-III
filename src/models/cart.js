const carritos = {};

class Carrito {
  constructor(usuarioId) {
    this.usuarioId = usuarioId;
    this.items = [];
    this.total = 0;
  }
  
  agregarProducto(productoId, cantidad, precio) {
    const itemExistente = this.items.find(item => item.productoId === productoId);
    
    if (itemExistente) {
      itemExistente.cantidad += cantidad;
    } else {
      this.items.push({ productoId, cantidad, precio });
    }
    
    this.calcularTotal();
  }
  
  calcularTotal() {
    this.total = this.items.reduce((sum, item) => {
      return sum + (item.precio * item.cantidad);
    }, 0);
  }
  
  vaciar() {
    this.items = [];
    this.total = 0;
  }
}