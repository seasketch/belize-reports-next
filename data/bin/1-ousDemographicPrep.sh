#!/bin/bash

# OKAY! Here's how the OUS Demographic set up works in the Belize reports (from data/bin folder):
# 1. Run this script data folder to create json: 
#    ./1-ousDemographicPrep.sh
# 2. Run this script to publish fgb to aws:
#    ./2-ousDemographicPublish.sh
# 3. Run this script to precalculate demographics data overlap:
#    npx tsx 3-ousDemographicPrecalc.ts

# Pares down OUS demographic data (copied from Data Products) to what reports need
# and saves into data/dist/ous_demographics.json for use in precalc 

# Delete old merged geojson since ogr2ogr can't overwrite it
rm ../src/Data_Products/data-package/ous_demographics.geojson

# Select only necessary columns
ogr2ogr -t_srs "EPSG:4326" -f GeoJSON -nlt PROMOTE_TO_MULTI -wrapdateline -dialect OGRSQL -sql "select scrubbed_ous_shapes.anon_id as resp_id, scrubbed_ous_shapes.commercial_fishing_gear_type as gear, scrubbed_ous_shapes.regions_represented as community, scrubbed_ous_shapes.priority as weight, scrubbed_ous_shapes.sector as sector, scrubbed_ous_shapes.participants as number_of_ppl, scrubbed_ous_shapes.district_community_corozal_chunox_village as corozal_chunox_village, scrubbed_ous_shapes.district_community_other as other, scrubbed_ous_shapes.district_community_belize_belize_city as belize_belize_city, scrubbed_ous_shapes.district_community_corozal_corozal_town as corozal_corozal_town, scrubbed_ous_shapes.district_community_belize_san_pedro_town as san_pedro_town, scrubbed_ous_shapes.district_community_corozal_consejo_village as corozal_consejo_village, scrubbed_ous_shapes.district_community_toledo_barranco_village as toledo_barranco_village, scrubbed_ous_shapes.district_community_toledo_punta_gorda_town as toledo_punta_gorda_town, scrubbed_ous_shapes.district_community_belize_ladyville_village as belize_ladyville_village, scrubbed_ous_shapes.district_community_corozal_sarteneja_village as corozal_sarteneja_village, scrubbed_ous_shapes.district_community_stann_creek_dangriga_town as stann_creek_dangriga_town, scrubbed_ous_shapes.district_community_belize_gales_point_village as belize_gales_point_village, scrubbed_ous_shapes.district_community_belize_st_george_s_caye as belize_st_george_s_caye, scrubbed_ous_shapes.district_community_toledo_forest_home_village as toledo_forest_home_village, scrubbed_ous_shapes.district_community_toledo_punta_negra_village as toledo_punta_negra_village, scrubbed_ous_shapes.district_community_belize_caye_caulker_village as belize_caye_caulker_village, scrubbed_ous_shapes.district_community_corozal_copper_bank_village as corozal_copper_bank_village, scrubbed_ous_shapes.district_community_stann_creek_hopkins_village as stann_creek_hopkins_village, scrubbed_ous_shapes.district_community_belize_mullins_river_village as belize_mullins_river_village, scrubbed_ous_shapes.district_community_stann_creek_placencia_village as stann_creek_placencia_village, scrubbed_ous_shapes.district_community_toledo_cattle_landing_village as toledo_cattle_landing_village, scrubbed_ous_shapes.district_community_stann_creek_riversdale_village as stann_creek_riversdale_village, scrubbed_ous_shapes.district_community_stann_creek_mango_creek_village as stann_creek_mango_creek_village, scrubbed_ous_shapes.district_community_stann_creek_seine_bight_village as stann_creek_seine_bight_village, scrubbed_ous_shapes.district_community_stann_creek_independence_village as stann_creek_independence_village, scrubbed_ous_shapes.district_community_stann_creek_maya_beach_community as stann_creek_maya_beach_community, scrubbed_ous_shapes.district_community_stann_creek_monkey_river_village as stann_creek_monkey_river_village, scrubbed_ous_shapes.district_community_stann_creek_sittee_river_village as stann_creek_sittee_river_village from scrubbed_ous_shapes" ../src/Data_Products/data-package/ous_demographics.geojson ../src/Data_Products/data-package/scrubbed_ous_shapes.geojson 

# Delete old dist files in prep for new
rm ../dist/ous_demographics.json
rm ../dist/ous_demographics.fgb

# Sort by respondent_id (for faster processing at runtime)
npx tsx ousDemographicSort.ts

# Create json file for direct import by precalc
cp ../src/Data_Products/data-package/ous_demographics_sorted.geojson ../dist/ous_demographics.json

# Generate cloud-optimized Flatgeobuf
./genFgb.sh ../dist/ous_demographics.json ../dist ous_demographics 'SELECT * FROM scrubbed_ous_shapes' -nlt PROMOTE_TO_MULTI