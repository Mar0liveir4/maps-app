import { Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  // Pega a div do html e coloca ela na variavel mapRef
  @ViewChild('map') mapRef!: ElementRef;

  //Cria uma variavel para o Maps
  map!: google.maps.Map;

  minhaPosicao!: google.maps.LatLng;

  listaEnderecos: google.maps.places.AutocompletePrediction[] = []

  private autoComplete = new google.maps.places.AutocompleteService();
  private directions = new google.maps.DirectionsService();
  private directionsRender = new google.maps.DirectionsRenderer();

  constructor(private ngZone: NgZone) { }

  async exibirMapa() {

    // The location of Uluru
    const position = { lat: -22.463255, lng: -48.562072 };


    // The map, centered at Uluru
    this.map = new google.maps.Map(
      this.mapRef.nativeElement,
      {
        zoom: 4,
        center: position,
        mapId: 'DEMO_MAP_ID',
      }
    );

    this.buscarLocalizacao();
  }

  ionViewWillEnter() {
    this.exibirMapa();
  }

  async buscarLocalizacao() {

    const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
    console.log('Current position:', coordinates);

    this.minhaPosicao = new google.maps.LatLng({
      lat: coordinates.coords.latitude,
      lng: coordinates.coords.longitude
    });

    this.map.setCenter(this.minhaPosicao);

    this.map.setZoom(18);

    this.adicionaMarcador(this.minhaPosicao);

  }

  async adicionaMarcador(position: google.maps.LatLng) {

    const marker = new google.maps.Marker({
      map: this.map,
      position: position,
      title: 'Marcador'
    });
  }

  // Buscar endereços no Maps
  buscarEndereco(valorBusca: any) {
    const busca = valorBusca.target.value as string;

    // Lembrando que 0 representa False
    if (!busca.trim().length) { //Verifica se veio testo na busca.
      this.listaEnderecos = []; //Se não tem busca, limpa a lista
      return false; // encerra a função
    }

    //Busca o endereço no Maps.
    this.autoComplete.getPlacePredictions(
      { input: busca }, //Envia o valor da busca para o maps
      (arrayLocais, status) => {
        if (status == 'OK') { //Se tiver retorno de busca
          this.ngZone.run(() => { //Avisa ao HTML que tem mudança
            //Atribui o retorno a lista se ela possuir valores.
            this.listaEnderecos = arrayLocais ? arrayLocais : [];
            console.log(this.listaEnderecos);
          });
        } else {
          //se deu erro na busca, limpa a lista.
          this.listaEnderecos = [];
        }
      }
    );
    return true;
  }
  //Converte o texto do endereço uma posição do GPS
  tracarRota(local: google.maps.places.AutocompletePrediction) {
    this.listaEnderecos = []; // limpa a lista de busca
    new google.maps.Geocoder().geocode({ address: local.description }, resultado => {
      this.adicionaMarcador(resultado![0].geometry.location); // Adicione  marcador no local

      //criar a configuração da rota
      const rota: google.maps.DirectionsRequest = {
        origin: this.minhaPosicao,
        destination: resultado![0].geometry.location,
        unitSystem: google.maps.UnitSystem.METRIC,
        travelMode: google.maps.TravelMode.DRIVING

      }
      // traca a rota entre os endereços
      this.directions.route(rota, (resultado, status) => {
        if (status == 'OK') {
          //Detalhe a rota do Mapa.
          this.directionsRender.setMap(this.map);
          this.directionsRender.setOptions({ suppressMarkers: true });
          this.directionsRender.setDirections(resultado);
        }
      });
    })
  }

}
