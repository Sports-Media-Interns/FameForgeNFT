import { Avatar, Box, Container, Flex, Input, SimpleGrid, Skeleton, Stack, Text } from "@chakra-ui/react";
import { MediaRenderer, ThirdwebNftMedia, Web3Button, useContract, useMinimumNextBid, useValidDirectListings } from "@thirdweb-dev/react";
import { NFT, ThirdwebSDK } from "@thirdweb-dev/sdk";
import React, { useState } from "react";
import {
    MARKETPLACE_ADDRESS,
    NFT_COLLECTION_ADDRESS
} from "../../../const/addresses";
import { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";

type Props = {
    nft: NFT;
    contractMetadata: any;
};

export default function TokenPage({ nft, contractMetadata }: Props) {
    const { contract: marketplace, isLoading: loadingMarketplace } =
    useContract(
        MARKETPLACE_ADDRESS,
        "marketplace-v3"
    );

    const { contract: nftCollection } = useContract(NFT_COLLECTION_ADDRESS);

    const { data: directListing, isLoading: loadingDirectListing } =
    useValidDirectListings(marketplace, {
        tokenContract: NFT_COLLECTION_ADDRESS,
        tokenId: nft.metadata.id,
    });

    async function buyListing() {
        let txResult;

        if(directListing?.[0]){
            txResult = await marketplace?.directListings.buyFromListing(
                directListing[0].id,
                1
            )
        } else {
            throw new Error("No listing found");
        }

        return txResult;
    }

    return (
        <Container maxW={"1200px"} p={5} my={5}>
            <SimpleGrid columns={2} spacing={6}>
                <Stack spacing={"20px"}>
                    <Box borderRadius={"6px"} overflow={"hodden"}>
                        <Skeleton isLoaded={!loadingMarketplace && !loadingDirectListing}>
                            <ThirdwebNftMedia
                                metadata={nft.metadata}
                                width="100%"
                                height="100%"
                            />
                        </Skeleton>
                    </Box>
                    <Box>
                        <Text fontWeight={"bold"}>Description</Text>
                        <Text>{nft.metadata.description}</Text>
                    </Box>
                    <Box>
                        <Text fontWeight={"bold"}>Traits:</Text>
                        <SimpleGrid columns={2} spacing={4}>
                            {Object.entries(nft?.metadata.attributes || {}).map(
                                ([key, value]) => (
                                    <Flex key={key} direction={"column"} alignItems={"center"} justifyContent={"center"} borderWidth={1}>
                                        <Text fontSize={"small"}>{value.trait_type}</Text>
                                        <Text fontSize={"small"} fontWeight={"bold"}>{value.value}</Text>
                                    </Flex>
                                )
                            )}
                        </SimpleGrid>
                    </Box>
                </Stack>
                <Stack spacing={"20px"}>
                    {contractMetadata.metadata && (
                        <Flex alignItems={"center"}>
                            <Box borderRadius={"4px"} overflow={"hidden"} mr={"10px"}>
                                <MediaRenderer
                                    src={contractMetadata.image}
                                    height="32px"
                                    width="32px"
                                />
                            </Box>
                            <Text fontWeight={"bold"}>{contractMetadata.name}</Text>
                        </Flex>
                    )}
                    <Box mx={2.5}>
                        <Text fontSize={"4xl"} fontWeight={"bold"}>{nft.metadata.name}</Text>
                        <Link
                            href={`/profile/${nft.owner}`}
                        >
                            <Flex direction={"row"} alignItems={"center"}>
                                <Avatar src='https://bit.ly/broken-link' h={"24px"} w={"24px"} mr={"10px"}/>
                                <Text fontSize={"small"}>{nft.owner.slice(0,6)}...{nft.owner.slice(-4)}</Text>
                            </Flex>
                        </Link>
                    </Box>

                    <Stack backgroundColor={"#EEE"} p={2.5} borderRadius={"6px"}>
                        <Text color={"darkgray"}>Price:</Text>
                        <Skeleton isLoaded={!loadingMarketplace && !loadingDirectListing}>
                            {directListing && directListing[0] ? (
                                <Text fontSize={"3xl"} fontWeight={"bold"}>
                                    {directListing[0]?.currencyValuePerToken.displayValue}
                                    {" " + directListing[0]?.currencyValuePerToken.symbol}
                                </Text>
                            ) : (
                                <Text fontSize={"3xl"} fontWeight={"bold"}>Not for sale</Text>
                            )}
                        </Skeleton>
                    </Stack>
                    <Skeleton isLoaded={!loadingMarketplace || !loadingDirectListing}>
                        <Web3Button
                            contractAddress={MARKETPLACE_ADDRESS}
                            action={async () => buyListing()}
                            isDisabled={!directListing || !directListing[0]}
                        >Buy at asking price</Web3Button>
                    </Skeleton>
                </Stack>
            </SimpleGrid>
        </Container>
    )
}

export const getStaticProps: GetStaticProps = async (context) => {
    const tokenId = context.params?.tokenId as string;

    const sdk = new ThirdwebSDK("mumbai");

    const contract = await sdk.getContract(NFT_COLLECTION_ADDRESS);

    const nft = await contract.erc721.get(tokenId);

    let contractMetadata;

    try {
        contractMetadata = await contract.metadata.get();
    } catch (e) {}

    return {
        props: {
            nft,
            contractMetadata: contractMetadata || null,
        },
        revalidate: 1,
        };
    };

    export const getStaticPaths: GetStaticPaths = async () => {
        const sdk = new ThirdwebSDK("mumbai");
    
        const contract = await sdk.getContract(NFT_COLLECTION_ADDRESS);
    
        const nfts = await contract.erc721.getAll();
    
        const paths = nfts.map((nft) => {
            return {
                params: {
                    contractAddress: NFT_COLLECTION_ADDRESS,
                    tokenId: nft.metadata.id,
                },
            };
        });

        return {
            paths,
            fallback: "blocking",
        };
    };