use super::utils::{deploy_contract, Accounts};
use workshop::counter::{ICounterDispatcher, ICounterDispatcherTrait, counter_contract};
use snforge_std::{spy_events, EventSpyAssertionsTrait, start_cheat_caller_address};

#[test]
fn test_counter_event() {
    let contract_address = deploy_contract();
    let dispatcher = ICounterDispatcher { contract_address };

    start_cheat_caller_address(contract_address, Accounts::ADDRESS_ONE());
    let mut spy = spy_events();
    dispatcher.increase_counter();

    spy.assert_emitted(@array![ 
        (
            contract_address,
            counter_contract::Event::CounterIncreased(
                counter_contract::CounterIncreased {by: Accounts::ADDRESS_ONE(), value: 1 }
            )
        )
    ]);

}