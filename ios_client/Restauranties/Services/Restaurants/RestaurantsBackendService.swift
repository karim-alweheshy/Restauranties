//
//  RestaurantsBackendService.swift
//  Restauranties
//
//  Created by Karim Alweheshy on 11/23/20.
//

import Foundation
import Combine

protocol RestaurantsBackendService: BackendService {
    typealias RestaurantsCallback = (Result<[Restaurant], Error>) -> Void

    typealias RestaurantCallback = (Result<Restaurant, Error>) -> Void

    func getAllRestaurants(
        filter: AllRestaurantsFilter?,
        completionHandler: @escaping RestaurantsCallback
    ) -> AnyCancellable

    func getMyRestaurants(
        filter: MyRestaurantsFilter?,
        completionHandler: @escaping RestaurantsCallback
    ) -> AnyCancellable

    func createNewRestaurant(
        restaurant: Restaurant,
        completionHandler: @escaping RestaurantCallback
    ) -> AnyCancellable

    func deleteRestaurant(
        restaurantID: String,
        completionHandler: @escaping (Result<Void, Error>) -> Void
    ) -> AnyCancellable
}