cmake_minimum_required(VERSION 3.20)   # 3.20+ = good Emscripten support
project(BabylonEditor LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(DCMAKE_EXPORT_COMPILE_COMMANDS ON)
# include(FetchContent)

set(PROJECT_NAME "Scultor")

# Pin to a commit or tag you trust (keeps your build reproducible)
# set(OCTREE_GIT_TAG  "master")        # or a SHA like 7acb27d0

# FetchContent_Declare(
#   attcs_octree
#   GIT_REPOSITORY  https://github.com/attcs/Octree.git
#   GIT_TAG         ${OCTREE_GIT_TAG}
#   # header-only → nothing to build, so no SOURCE_SUBDIR needed
# )


# FetchContent_MakeAvailable(attcs_octree)

# add_library(Octree INTERFACE)

# target_include_directories(Octree INTERFACE ${attcs_octree_SOURCE_DIR})
# target_compile_features(Octree INTERFACE cxx_std_20)
# ---------------------------------------------------------------------------
# Source(s)
# ---------------------------------------------------------------------------


# include(FetchContent)

# FetchContent_Declare(
#   Catch2
#   GIT_REPOSITORY https://github.com/catchorg/Catch2.git
#   GIT_TAG        v3.5.4           # pin to a known good tag
# )
# FetchContent_MakeAvailable(Catch2)

# enable_testing()

add_executable(${PROJECT_NAME}
    src/main.cpp 
)


target_include_directories(${PROJECT_NAME} PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/include)

if(EMSCRIPTEN)
    message(STATUS "Emscripten defined")
    set_target_properties(${PROJECT_NAME} PROPERTIES SUFFIX ".js")
    target_compile_options(${PROJECT_NAME} PRIVATE
    "-g"
    "-pthread"
    "--bind"
    "-sUSE_PTHREADS=1"
    "-sALLOW_MEMORY_GROWTH=1"
    "-sEXPORT_ES6=1"
    "-sMODULARIZE=1"
    "-sEXPORT_NAME=${PROJECT_NAME}"
    "-sIMPORTED_MEMORY=1"
    "-sINITIAL_MEMORY=2GB" )

    target_link_options(${PROJECT_NAME} PRIVATE
        -pthread
        -fwasm-exceptions
        --bind
        "-sALLOW_MEMORY_GROWTH=1"
        "-sEXPORT_ES6=1"
        "-sMODULARIZE=1"
        "-sEXPORT_NAME=${PROJECT_NAME}"
        "-sEXPORTED_FUNCTIONS=['_malloc','_free', 'ccall']"
        "-sIMPORTED_MEMORY=1"
        "-sEXPORTED_RUNTIME_METHODS=['HEAPF32', 'HEAPU32']")

else()

    target_compile_options(${PROJECT_NAME} PRIVATE
    "-g"
    "-O0"
    "-pthread")

#  target_link_options(${PROJECT_NAME} PRIVATE
#      -pthread )
 endif()

add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
            ${CMAKE_SOURCE_DIR}/build/${PROJECT_NAME}.wasm
            ${CMAKE_SOURCE_DIR}/build/${PROJECT_NAME}.js
            ${CMAKE_SOURCE_DIR}/src
)
