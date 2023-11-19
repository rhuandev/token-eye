import { Component } from '@angular/core';
import { TokenService } from 'src/app/services/token.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  tokens: any[] = [];
  isLoading: boolean = true;
  walletAddress: string = '';

  constructor(public tokenService: TokenService) {}

  onSubmit(): void {
    this.tokenService.tokenFinal = [];
    
    if (this.walletAddress) {
      this.tokenService
        .listTokens(this.walletAddress)
        .then(() => {
          console.log(this.tokenService.tokenFinal, this.tokenService.tokensX);
        })
        .finally(() => {
          this.isLoading = false;
        })
        .catch((error) => console.error('Erro:', error));
    }
  }

  ngOnInit(): void {
    console.log(this.tokenService.tokenFinal, this.tokenService.tokensX);
  }
}
