import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, Contract, Wallet, JsonRpcProvider } from 'ethers';
import * as LFFSBT_ABI from './abi/LFFSBT.json';

export enum TokenType {
  EVENT_ATTENDANCE = 0,
  QUEST_COMPLETION = 1,
}

export interface MintResult {
  tokenId: string;
  transactionHash: string;
  blockNumber: number;
}

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: JsonRpcProvider;
  private wallet: Wallet;
  private sbtContract: Contract;
  private isInitialized = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      await this.initialize();
    } catch (error) {
      this.logger.warn(
        `Blockchain service initialization skipped: ${error.message}`,
      );
    }
  }

  private async initialize() {
    const rpcUrl = this.configService.get<string>('POLYGON_RPC_URL');
    const privateKey = this.configService.get<string>('MINTER_PRIVATE_KEY');
    const contractAddress = this.configService.get<string>(
      'SBT_CONTRACT_ADDRESS',
    );

    if (!rpcUrl || !privateKey || !contractAddress) {
      throw new Error('Missing blockchain configuration');
    }

    this.provider = new JsonRpcProvider(rpcUrl);
    this.wallet = new Wallet(privateKey, this.provider);
    this.sbtContract = new Contract(
      contractAddress,
      LFFSBT_ABI,
      this.wallet,
    );

    // Verify connection
    const network = await this.provider.getNetwork();
    this.logger.log(
      `Connected to ${network.name} (chainId: ${network.chainId})`,
    );
    this.logger.log(`Minter address: ${this.wallet.address}`);

    this.isInitialized = true;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Mint an SBT for event attendance
   */
  async mintEventAttendance(
    recipientAddress: string,
    metadataUri: string,
    eventId: string,
  ): Promise<MintResult> {
    return this.mint(
      recipientAddress,
      metadataUri,
      TokenType.EVENT_ATTENDANCE,
      eventId,
    );
  }

  /**
   * Mint an SBT for quest completion
   */
  async mintQuestCompletion(
    recipientAddress: string,
    metadataUri: string,
    questId: string,
  ): Promise<MintResult> {
    return this.mint(
      recipientAddress,
      metadataUri,
      TokenType.QUEST_COMPLETION,
      questId,
    );
  }

  /**
   * Internal mint function
   */
  private async mint(
    recipientAddress: string,
    metadataUri: string,
    tokenType: TokenType,
    referenceId: string,
  ): Promise<MintResult> {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    this.logger.log(
      `Minting SBT: to=${recipientAddress}, type=${tokenType}, ref=${referenceId}`,
    );

    try {
      const tx = await this.sbtContract.mint(
        recipientAddress,
        metadataUri,
        tokenType,
        referenceId,
      );

      this.logger.log(`Transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();

      // Parse TokenMinted event to get tokenId
      const mintEvent = receipt.logs.find(
        (log) =>
          log.topics[0] ===
          ethers.id('TokenMinted(uint256,address,uint8,string)'),
      );

      let tokenId = '0';
      if (mintEvent) {
        tokenId = ethers.toBigInt(mintEvent.topics[1]).toString();
      }

      this.logger.log(
        `SBT minted: tokenId=${tokenId}, txHash=${receipt.hash}`,
      );

      return {
        tokenId,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      this.logger.error(`Mint failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if address has token for a specific event/quest
   */
  async hasTokenForReference(
    ownerAddress: string,
    referenceId: string,
  ): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      return await this.sbtContract.hasTokenForReference(
        ownerAddress,
        referenceId,
      );
    } catch (error) {
      this.logger.error(`hasTokenForReference failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get all token IDs owned by an address
   */
  async getTokensByOwner(ownerAddress: string): Promise<string[]> {
    if (!this.isInitialized) {
      return [];
    }

    try {
      const tokenIds = await this.sbtContract.getTokensByOwner(ownerAddress);
      return tokenIds.map((id: bigint) => id.toString());
    } catch (error) {
      this.logger.error(`getTokensByOwner failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Get token metadata
   */
  async getTokenMetadata(tokenId: string): Promise<{
    tokenType: TokenType;
    referenceId: string;
    mintedAt: Date;
  } | null> {
    if (!this.isInitialized) {
      return null;
    }

    try {
      const metadata = await this.sbtContract.tokenMetadata(tokenId);
      return {
        tokenType: metadata.tokenType,
        referenceId: metadata.referenceId,
        mintedAt: new Date(Number(metadata.mintedAt) * 1000),
      };
    } catch (error) {
      this.logger.error(`getTokenMetadata failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Get token URI
   */
  async getTokenURI(tokenId: string): Promise<string | null> {
    if (!this.isInitialized) {
      return null;
    }

    try {
      return await this.sbtContract.tokenURI(tokenId);
    } catch (error) {
      this.logger.error(`getTokenURI failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return this.configService.get<string>('SBT_CONTRACT_ADDRESS') || '';
  }

  /**
   * Get minter wallet address
   */
  getMinterAddress(): string {
    return this.wallet?.address || '';
  }
}
