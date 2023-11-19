import { Injectable } from '@angular/core';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import axios from 'axios';
import { environment } from 'src/environments/environment.development';

interface TokenAccount {
  tokenAddress: string;
  tokenAmount: number;
}

interface TokenInfo {
  tokenAddress: string;
  tokenPriceX: number;
  tokenAmount: number;
  tokenValue: number;
}

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private connection: Connection;
  tokensX: TokenAccount[] = [];
  tokenFinal: TokenInfo[] = [];

  constructor() {
    this.connection = new Connection(environment.solanaRpcUrl, 'confirmed');
  }

  private divideEmLotes(array: any[], tamanhoDoLote: number): any[][] {
    let resultado = [];

    for (let i = 0; i < array.length; i += tamanhoDoLote) {
      resultado.push(array.slice(i, i + tamanhoDoLote));
    }
    return resultado;
  }

  async listTokens(walletAddress: string): Promise<void> {
    this.tokenFinal = [];
    this.tokensX = [];

    // Verificar se o endereço da carteira é válido
    if (!PublicKey.isOnCurve(walletAddress)) {
      throw new Error('Endereço da carteira inválido');
    }

    const publicKey = new PublicKey(walletAddress);

    // Buscar todos os tokens associados à carteira
    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
      publicKey,
      {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      }
    );

    // Popular this.tokensX
    for (const account of tokenAccounts.value) {
      let uiAmount = account.account.data.parsed.info.tokenAmount.uiAmount;
      if (uiAmount && uiAmount !== 0 && uiAmount !== 1) {
        this.tokensX.push({
          tokenAddress: account.account.data.parsed.info.mint,
          tokenAmount: uiAmount,
        });
      }
    }

    // Processar os lotes de tokens
    const tamanhoDoLote = 30;
    const enderecosTokens = this.tokensX.map(t => t.tokenAddress);
    const lotesDeTokens = this.divideEmLotes(enderecosTokens, tamanhoDoLote);

    try {
      for (const lote of lotesDeTokens) {
        const addToken = lote.join(',');
        const url = `https://api.geckoterminal.com/api/v2/simple/networks/solana/token_price/${addToken}`;
        const response = await axios.get(url);
        const tokenPrices = response.data.data.attributes.token_prices;

        lote.forEach(tokenAddress => {
          const token = this.tokensX.find(t => t.tokenAddress === tokenAddress);
          if (token) {
            const tokenPrice: number = tokenPrices[tokenAddress];
            if (tokenPrice) {
              const tokenTotalValue = token.tokenAmount * tokenPrice;
              if (tokenTotalValue >= 1) {

                // ignore USDC, wSOL, e USDT
                if(token.tokenAddress != 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' && token.tokenAddress != 'So11111111111111111111111111111111111111112'  && token.tokenAddress != 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB') {
                  this.tokenFinal.push({
                    tokenAddress: token.tokenAddress,
                    tokenPriceX: tokenPrice,
                    tokenAmount: token.tokenAmount,
                    tokenValue: tokenTotalValue,
                  });
                }
              
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('Erro ao obter preços dos tokens:', error);
    }
}

}
