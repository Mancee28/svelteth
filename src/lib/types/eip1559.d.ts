export interface GasEstimates {
	baseFee: bigint;
	priority: {
		safe: bigint;    
		average: bigint;  
		fast: bigint;     
	};
}