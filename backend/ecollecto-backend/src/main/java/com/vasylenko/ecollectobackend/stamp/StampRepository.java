package com.vasylenko.ecollectobackend.stamp;

import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface StampRepository extends MongoRepository<StampDocument, String> {

    @Query("{ 'release.year': ?0 }")
    List<StampDocument> findByReleaseYear(int year);

    @Aggregation(pipeline = {
        "{ $group: { _id: '$release.year', count: { $sum: 1 } } }",
        "{ $project: { _id: 0, year: '$_id', count: 1 } }",
        "{ $sort: { year: -1 } }"
    })
    List<YearCount> findDistinctReleaseYears();

    interface YearCount {
        Integer getYear();
        Long getCount();
    }
}
