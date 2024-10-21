use starknet::{ContractAddress};
use snforge_std::{declare, ContractClassTrait, DeclareResultTrait};


pub mod Accounts {
    use starknet::{ContractAddress, contract_address_const};

    pub fn ADDRESS_ONE() -> ContractAddress {
        contract_address_const::<'address_one'>()
    }

    pub fn ADDRESS_TWO() -> ContractAddress {
        contract_address_const::<'address_two'>()
    }

    pub fn ADDRESS_THREE() -> ContractAddress {
        contract_address_const::<'address_three'>()
    }
    
    pub fn ZERO() -> ContractAddress {
        contract_address_const::<0>()
    }
}

pub fn deploy_contract() -> ContractAddress {
    let contract = declare("counter_contract").unwrap().contract_class();
    let (contract_address, _) = contract.deploy(@array![]).unwrap();
    contract_address
}